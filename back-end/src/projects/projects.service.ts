import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { AiAssistantService } from '../ai-assistant/ai-assistant.service';
import { Inject, forwardRef } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private notificationsService: NotificationsService,
    private mailerService: MailerService,
    private usersService: UsersService,
    @Inject(forwardRef(() => AiAssistantService))
    private aiAssistantService: AiAssistantService,
  ) {}

  async create(createProjectDto: CreateProjectDto) {
    const { dateD, dateF, ...rest } = createProjectDto;
    const responses: Record<string, string> = {};
    if (createProjectDto.artisanIds) {
      for (const artId of createProjectDto.artisanIds) {
        responses[artId.toString()] = 'pending';
      }
    }

    const newProject = this.projectsRepository.create({
      ...(rest as any),
      dateD: new Date(dateD),
      dateF: new Date(dateF),
      maquettes: createProjectDto.maquettes || [],
      idUserEng: createProjectDto.idUserEng
        ? String(createProjectDto.idUserEng)
        : null,
      status: 'pending',
      artisanResponses: responses,
    });

    const saved = (await this.projectsRepository.save(
      newProject,
    )) as unknown as Project;

    // Trigger notifications for artisans
    if (createProjectDto.artisanIds) {
      for (const artId of createProjectDto.artisanIds) {
        // In-app notification
        await this.notificationsService.create({
          userId: artId.toString(),
          senderId: saved.idUserEng?.toString() ?? undefined,
          type: 'project_invitation',
          referenceId: saved._id.toString(),
          title: 'New Project Invitation',
          content: `You have been invited to join the project: ${saved.nom}`,
        });

        // Email notification
        const artisan = await this.usersService.findOne(artId.toString());
        if (artisan && artisan.email) {
          try {
            await this.mailerService.sendMail({
              to: artisan.email,
              subject: `[BMP] Invitation Nouveau Projet : ${saved.nom}`,
              template: './project-invitation',
              context: {
                artisanName: `${artisan.prenom} ${artisan.nom}`,
                projectName: saved.nom,
                location: saved.location || 'N/A',
                cout: saved.cout,
                responseUrl: `http://localhost:3001/notifications`, // Redirect to notifications to accept
              },
            });
            console.log(`Email sent to artisan: ${artisan.email}`);
          } catch (e) {
            console.error(`Error sending email to ${artisan.email}:`, e);
          }
        }
      }
    }

    return saved;
  }

  async findAll() {
    return this.projectsRepository.find();
  }

  async findOne(id: string) {
    return this.projectsRepository.findOneBy({ _id: new ObjectId(id) } as any);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id);
    if (project) {
      const oldArtisanIds = project.artisanIds || [];
      const updates: any = { ...updateProjectDto };
      if (updateProjectDto.dateD)
        updates.dateD = new Date(updateProjectDto.dateD);
      if (updateProjectDto.dateF)
        updates.dateF = new Date(updateProjectDto.dateF);
      if (updateProjectDto.idUserEng)
        updates.idUserEng = String(updateProjectDto.idUserEng);

      if (updateProjectDto.artisanIds) {
        project.artisanIds = updateProjectDto.artisanIds;

        // Initialize responses for NEW artisans
        if (!project.artisanResponses) project.artisanResponses = {};

        for (const artId of updateProjectDto.artisanIds) {
          const isNew = !oldArtisanIds.some(
            (oid) => oid.toString() === artId.toString(),
          );
          if (isNew) {
            console.log(`Triggering notification for new artisan ${artId}`);
            project.artisanResponses[artId] = 'pending';
            // Trigger notification
            await this.notificationsService.create({
              userId: artId.toString(),
              senderId: project.idUserEng?.toString() ?? undefined,
              type: 'project_invitation',
              referenceId: id.toString(),
              title: 'New Project Invitation',
              content: `You have been invited to join the project: ${project.nom}`,
            });

            // Email notification
            const artisan = await this.usersService.findOne(artId.toString());
            if (artisan && artisan.email) {
              try {
                await this.mailerService.sendMail({
                  to: artisan.email,
                  subject: `[BMP] Invitation Nouveau Projet : ${project.nom}`,
                  template: './project-invitation',
                  context: {
                    artisanName: `${artisan.prenom} ${artisan.nom}`,
                    projectName: project.nom,
                    location: project.location || 'N/A',
                    cout: project.cout,
                    responseUrl: `http://localhost:3001/notifications`,
                  },
                });
                console.log(
                  `Email sent to NEW artisan during update: ${artisan.email}`,
                );
              } catch (e) {
                console.error(`Error sending email to ${artisan.email}:`, e);
              }
            }
          }
        }
      }

      this.projectsRepository.merge(project, updates);
      return this.projectsRepository.save(project);
    }
    return null;
  }

  async updateArtisanResponse(
    projectId: string,
    artisanId: string,
    response: 'accepted' | 'refused',
  ) {
    const project = await this.findOne(projectId);
    if (!project) return null;
    if (!project.artisanResponses) project.artisanResponses = {};

    project.artisanResponses[artisanId] = response;
    project.artisanResponses = { ...project.artisanResponses }; // Trigger MongoDB change detection

    // Also update the specific task's status if they were assigned one
    if (project.tasks) {
      const taskIndex = project.tasks.findIndex(
        (t) => String(t.assignedArtisanId) === String(artisanId),
      );
      if (taskIndex !== -1) {
        const updatedTasks = [...project.tasks];
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          status: response === 'accepted' ? 'accepted' : 'refused',
        };
        if (response === 'accepted') {
          updatedTasks[taskIndex].negotiatedPrice =
            updatedTasks[taskIndex].budget;
        }
        project.tasks = updatedTasks;
      }
    }

    // Check if all accepted
    const responsesList = Object.values(project.artisanResponses);
    const acceptedCount = responsesList.filter((r) => r === 'accepted').length;
    const totalRequired = Number(project.nbArtisan);

    console.log(`[ProjectService] Response from ${artisanId}: ${response}`);
    console.log(
      `[ProjectService] Current responses: ${responsesList.length}/${totalRequired} (${acceptedCount} accepted)`,
    );

    const anyAccepted = acceptedCount > 0;

    if (anyAccepted && project.status === 'pending') {
      console.log(
        `[ProjectService] An artisan accepted. Project ${projectId} is now ACTIVE!`,
      );
      project.status = 'active';

      // Notify the Engineer
      this.notificationsService.create({
        userId: project.idUserEng as string,
        senderId: artisanId,
        type: 'project_active',
        referenceId: project._id.toString(),
        title: 'Project Officially Active!',
        content: `Your project "${project.nom}" is now active. All artisans have accepted.`,
      });
    } else {
      console.log(`[ProjectService] Project ${projectId} remains PENDING.`);
    }

    const saved = await this.projectsRepository.save(project);

    // Notify Engineer
    if (project.idUserEng) {
      await this.notificationsService.create({
        userId: project.idUserEng.toString(),
        senderId: artisanId?.toString() ?? undefined,
        type: response === 'accepted' ? 'project_accepted' : 'project_refused',
        referenceId: projectId.toString(),
        title: `Artisan ${response === 'accepted' ? 'Accepted' : 'Refused'}`,
        content: `An artisan has ${response} your invitation for project: ${project.nom}`,
      });
    }

    return saved;
  }

  async remove(id: string) {
    const project = await this.findOne(id);
    if (project) {
      return this.projectsRepository.remove(project);
    }
    return null;
  }

  async addTask(projectId: string, taskData: any) {
    const project = await this.findOne(projectId);
    if (!project) return null;

    if (!project.tasks) project.tasks = [];
    const newTask = {
      ...taskData,
      id: uuidv4(),
      status: 'pending',
      assignedArtisanId: null,
    };
    project.tasks.push(newTask);
    return this.projectsRepository.save(project);
  }

  async assignArtisanToTask(
    projectId: string,
    taskId: string,
    artisanId: string,
  ) {
    const project = await this.findOne(projectId);
    if (!project) return null;

    const task = project.tasks?.find((t) => t.id === taskId);
    if (!task) return null;

    // --- 🛡️ Constraint: Max 3 Projects ---
    const activeCountObj = await this.countActiveProjectsForArtisan(artisanId);
    if (activeCountObj.count >= 3) {
      throw new BadRequestException(
        "L'artisan est déjà occupé (maximum 3 projets actifs).",
      );
    }

    const isAlreadyInvited =
      task.assignedArtisanId?.toString() === artisanId.toString() &&
      !!task.invitedAt;

    task.assignedArtisanId = artisanId;
    task.status = 'pending';

    const artisan = await this.usersService.findOne(artisanId);

    // Add to project artisanIds if not already there
    if (project.artisanIds) {
      const artIdStr = artisanId.toString();
      if (!project.artisanIds.some((id) => id.toString() === artIdStr)) {
        project.artisanIds.push(artisanId as any);
      }
    } else {
      project.artisanIds = [artisanId as any];
    }

    task.invitedAt = new Date();
    console.log(
      `[Assignment] Task ${taskId} invitedAt set to ${task.invitedAt}`,
    );

    // --- 📧 Email Notification ---
    if (artisan && artisan.email && !isAlreadyInvited) {
      console.log(`[Assignment] Sending email to ${artisan.email}`);
      const responseUrl = `http://localhost:3001/artisan/task-response/${projectId}/${taskId}`;
      try {
        await this.mailerService.sendMail({
          to: artisan.email,
          subject: `[BMP] Nouvelle mission : ${task.category}`,
          template: './task-invitation',
          context: {
            artisanName: `${artisan.prenom} ${artisan.nom}`,
            projectName: project.nom,
            category: task.category,
            description: task.description,
            budget: task.budget,
            responseUrl,
            aiAdvice: task.aiAdvice,
            recommendedCount: task.aiRecommendedProducts?.length || 0,
          },
        });
        console.log(
          `[Assignment] Email sent successfully to: ${artisan.email}`,
        );
      } catch (mailErr) {
        console.error(
          `[Assignment] Failed to send email to ${artisan.email}:`,
          mailErr.message,
        );
      }
    } else {
      console.warn(
        `[Assignment] Email skipped: hasArtisan=${!!artisan}, email=${artisan?.email}, alreadyInvited=${isAlreadyInvited}`,
      );
    }

    // --- 🔔 In-App Notification ---
    if (!isAlreadyInvited) {
      console.log(
        `[Assignment] Creating in-app notification for artisan ${artisanId}`,
      );
      try {
        await this.notificationsService.create({
          userId: artisanId,
          senderId: project.idUserEng?.toString() || undefined,
          type: 'task_invitation',
          referenceId: `${projectId}|${taskId}`,
          title: 'Nouvelle mission assignée',
          content: `Vous avez été invité pour la tâche "${task.category}" du projet ${project.nom}`,
        });
        console.log(
          `[Assignment] In-app notification created for ${artisanId}`,
        );
      } catch (notifErr) {
        console.error(
          `[Assignment] Failed to create in-app notification for ${artisanId}:`,
          notifErr.message,
        );
      }
    }

    // Ensure array change detection for MongoDB/TypeORM
    if (project.tasks) {
      project.tasks = [...project.tasks];
    }

    return this.projectsRepository.save(project);
  }

  async updateTaskStatus(
    projectId: string,
    taskId: string,
    artisanId: string,
    status: any,
  ) {
    const project = await this.findOne(projectId);
    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const taskIndex = project.tasks?.findIndex((t) => t.id === taskId);
    if (taskIndex === undefined || taskIndex === -1) {
      console.error(`[Project] Task ${taskId} not found`);
      throw new BadRequestException('Task not found');
    }

    const task = project.tasks![taskIndex];
    if (String(task.assignedArtisanId) !== String(artisanId)) {
      console.error(
        `[Project] Artisan mismatch: assigned ${task.assignedArtisanId} vs requesting ${artisanId}`,
      );
      throw new BadRequestException('Artisan mismatch');
    }

    // Force TypeORM to detect nested change by cloning array AND the modified object
    const updatedTasks = [...(project.tasks || [])];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      status: status,
    };

    // Localize the agreed price: if accepting, the current budget becomes the negotiated price
    if (status === 'accepted') {
      updatedTasks[taskIndex].negotiatedPrice = updatedTasks[taskIndex].budget;
    }

    project.tasks = updatedTasks;

    // --- Project Activation Logic ---
    // The project becomes active if AT LEAST ONE task is 'accepted'
    const anyTaskAccepted =
      project.tasks.length > 0 &&
      project.tasks.some((t) => t.status === 'accepted');

    if (anyTaskAccepted && project.status === 'pending') {
      console.log(
        `[Project] A task was accepted for project ${projectId}. Setting to ACTIVE.`,
      );
      project.status = 'active';
    } else {
      console.log(
        `[Project] Project ${projectId} status remains ${project.status}.`,
      );
    }

    // Update general artisan response
    if (!project.artisanResponses) project.artisanResponses = {};
    project.artisanResponses[artisanId] = status;
    project.artisanResponses = { ...project.artisanResponses };

    return this.projectsRepository.save(project);
  }

  async proposeTaskPrice(
    projectId: string,
    taskId: string,
    artisanId: string,
    price: number,
  ) {
    const project = await this.findOne(projectId);
    if (!project) return null;

    const task = project.tasks?.find((t) => t.id === taskId);
    if (!task || task.assignedArtisanId !== artisanId) return null;

    task.artisanProposedPrice = price;
    task.status = 'negotiating';

    // Notify engineer
    if (project.idUserEng) {
      await this.notificationsService.create({
        userId: project.idUserEng,
        senderId: artisanId,
        type: 'quotation',
        referenceId: `${projectId}|${taskId}`,
        title: 'Nouvelle proposition de prix',
        content: `L'artisan a proposé ${price} DT pour la tâche "${task.category}" du projet ${project.nom}`,
      });
    }

    if (project.tasks) {
      project.tasks = [...project.tasks];
    }
    return this.projectsRepository.save(project);
  }

  async finalizeTaskPrice(projectId: string, taskId: string, price: number) {
    const project = await this.findOne(projectId);
    if (!project) return null;

    const task = project.tasks?.find((t) => t.id === taskId);
    if (!task) return null;

    task.negotiatedPrice = price;
    task.status = 'accepted';

    // Check if the whole project can become active
    const tasks = project.tasks || [];
    const anyTaskAccepted =
      tasks.length > 0 && tasks.some((t) => t.status === 'accepted');

    if (anyTaskAccepted && project.status === 'pending') {
      console.log(
        `[Project] Final negotiation settled. Project ${projectId} is now ACTIVE.`,
      );
      project.status = 'active';
    }

    // Notify artisan
    if (task.assignedArtisanId) {
      await this.notificationsService.create({
        userId: task.assignedArtisanId,
        senderId: project.idUserEng?.toString() || undefined,
        type: 'accepted',
        referenceId: `${projectId}|${taskId}`,
        title: 'Prix accepté !',
        content: `L'ingénieur a accepté le prix de ${price} DT pour votre mission.`,
      });
    }

    if (project.tasks) {
      project.tasks = [...project.tasks];
    }
    return this.projectsRepository.save(project);
  }

  async counterTaskPrice(projectId: string, taskId: string, price: number) {
    const project = await this.findOne(projectId);
    if (!project) return null;

    const task = project.tasks?.find((t) => t.id === taskId);
    if (!task) return null;

    task.budget = price; // Update the effective budget for this task
    task.status = 'counter_offered';

    // Notify artisan
    if (task.assignedArtisanId) {
      await this.notificationsService.create({
        userId: task.assignedArtisanId,
        senderId: project.idUserEng?.toString() || undefined,
        type: 'quotation',
        referenceId: `${projectId}|${taskId}`,
        title: 'Contre-proposition reçue',
        content: `L'ingénieur a fait une contre-proposition de ${price} DT pour la tâche "${task.category}".`,
      });
    }

    if (project.tasks) {
      project.tasks = [...project.tasks];
    }
    return this.projectsRepository.save(project);
  }

  async selectTaskProducts(
    projectId: string,
    taskId: string,
    productIds: string[],
  ) {
    const project = await this.findOne(projectId);
    if (!project) return null;

    const taskIndex = project.tasks?.findIndex((t) => t.id === taskId);
    if (taskIndex === undefined || taskIndex === -1) return null;

    const updatedTasks = [...(project.tasks || [])];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      artisanSelectedProducts: productIds,
    };

    project.tasks = updatedTasks;
    return this.projectsRepository.save(project);
  }

  async addTaskProgress(
    projectId: string,
    taskId: string,
    artisanId: string,
    progressDto: any,
  ) {
    const project = await this.findOne(projectId);
    if (!project) throw new BadRequestException('Project not found');

    const taskIndex = project.tasks?.findIndex((t) => t.id === taskId);
    if (taskIndex === undefined || taskIndex === -1) {
      throw new BadRequestException('Task not found');
    }

    const updatedTasks = [...(project.tasks || [])];
    const task = updatedTasks[taskIndex];

    if (String(task.assignedArtisanId) !== String(artisanId)) {
      throw new BadRequestException('Artisan mismatch');
    }

    const currentProgressHistory = task.progressUpdates || [];

    let safetyViolation = false;
    let safetyDetails = '';
    let safetyStatus = 'ignore';
    let hasSafetyCheck = false;

    // --- YOLO Safety Check ---
    if (progressDto.images && progressDto.images.length > 0) {
      try {
        // Resolve path (e.g. from '/assets/images/projects/xxx.jpg' to absolute)
        const imageRelativePath = progressDto.images[0];
        const baseDir = path.join(process.cwd(), '..', 'front-end', 'public');
        const absolutePath = path.join(
          baseDir,
          imageRelativePath.startsWith('/')
            ? imageRelativePath.substring(1)
            : imageRelativePath,
        );

        console.log(`[YOLO DEBUG] Checking image at: ${absolutePath}`);

        if (fs.existsSync(absolutePath)) {
          hasSafetyCheck = true;
          console.log(`[YOLO DEBUG] File found! Sending to ML service...`);
          const mlRes = await axios.post(
            'http://localhost:8000/analyze-safety',
            {
              image_path: absolutePath,
            },
          );
          if (mlRes.data) {
            safetyViolation = mlRes.data.safety_violation;
            safetyStatus = mlRes.data.safety_status;
            safetyDetails = mlRes.data.details;
            console.log(
              `[YOLO DEBUG] Result: status=${safetyStatus}, violation=${safetyViolation}`,
            );
          }
        } else {
          console.log(`[YOLO DEBUG] FILE NOT FOUND at ${absolutePath}`);
        }
      } catch (e) {
        console.error('[YOLO DEBUG] Error:', e.message);
        if (e.response) {
          console.error(
            '[YOLO DEBUG] ML Service Error Response:',
            e.response.data,
          );
        }
      }
    }

    currentProgressHistory.push({
      ...progressDto,
      hasSafetyCheck,
      safetyViolation,
      safetyStatus,
      safetyDetails,
      date: new Date().toISOString(),
    });

    updatedTasks[taskIndex] = {
      ...task,
      progressUpdates: currentProgressHistory,
      currentPercentage:
        progressDto.percentage !== undefined
          ? progressDto.percentage
          : task.currentPercentage,
    };

    project.tasks = updatedTasks;
    const saved = await this.projectsRepository.save(project);

    // Notify engineer about progress
    if (project.idUserEng) {
      await this.notificationsService.create({
        userId: project.idUserEng.toString(), // Target: Engineer
        senderId: artisanId.toString(),
        type: 'message',
        referenceId: projectId,
        title: 'Nouvelle Progression !',
        content: `L'artisan a ajouté un avancement de projet (${progressDto.percentage}%) pour la tâche de ${task.category}.`,
      });

      // Notify engineer about SAFETY VIOLATION
      if (safetyViolation) {
        await this.notificationsService.create({
          userId: project.idUserEng.toString(),
          senderId: artisanId.toString(),
          type: 'safety_violation',
          referenceId: projectId,
          title: '⚠️ Alerte de Sécurité (EPI)',
          content: `Le système IA a détecté une infraction de sécurité sur la dernière photo de l'artisan (${task.category}): ${safetyDetails}`,
        });
      }
    }

    return saved;
  }

  async findForArtisan(artisanId: string) {
    const allProjects = await this.findAll();
    return allProjects.filter((p) =>
      p.tasks?.some((t) => String(t.assignedArtisanId) === String(artisanId)),
    );
  }

  async countActiveProjectsForArtisan(artisanId: string) {
    const projects = await this.findForArtisan(artisanId);
    const count = projects.filter((p) => p.status === 'active').length;
    return { count };
  }
}
