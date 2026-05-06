import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from '../projects/projects.module';
import { ClusteringService } from './clustering.service';

@Module({
  imports: [ConfigModule, forwardRef(() => ProjectsModule)],
  providers: [ClusteringService],
  exports: [ClusteringService],
})
export class ClusteringModule {}
