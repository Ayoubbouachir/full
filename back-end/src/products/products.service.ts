import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const newProduct = this.productsRepository.create({
      ...createProductDto,
      imagePUrl: createProductDto.imagePUrl || '',
      description: createProductDto.description || '',
    });
    return this.productsRepository.save(newProduct);
  }

  async findAll() {
    return this.productsRepository.find();
  }

  async findBySupplier(supplierId: string) {
    return this.productsRepository.find({ where: { supplierId } as any });
  }

  async findOne(id: string) {
    return this.productsRepository.findOneBy({ _id: new ObjectId(id) } as any);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (product) {
      this.productsRepository.merge(product, updateProductDto);
      return this.productsRepository.save(product);
    }
    return null;
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    if (product) {
      return this.productsRepository.remove(product);
    }
    return null;
  }

  async addReview(
    productId: string,
    review: {
      userId: string;
      userName?: string;
      rating?: number;
      comment?: string;
    },
  ) {
    const product = await this.findOne(productId);
    if (!product) return null;

    const targetUserId = String(review.userId).trim();
    const rawReviews = Array.isArray(product.reviews) ? product.reviews : [];

    // 1. CLEAN ALL DUPLICATES: Create a Map for ALL reviews
    // This will fix any historical data issues for this product
    const finalMap = new Map();

    // Add existing ones (if multiple exist for one user, the last one in the array wins)
    rawReviews.forEach((r) => {
      if (r?.userId) {
        finalMap.set(String(r.userId).trim(), r);
      }
    });

    // 2. OVERWRITE/ADD current user's rating
    const existing = finalMap.get(targetUserId);

    const mergedReview = {
      userId: targetUserId,
      userName: review.userName || (existing ? existing.userName : 'Anonymous'),
      // Only update rating if it's provided in this request, else keep existing
      rating:
        review.rating !== undefined
          ? Number(review.rating)
          : existing && existing.rating !== undefined
            ? Number(existing.rating)
            : 0,
      // Only update comment if it's provided in this request, else keep existing
      comment:
        review.comment !== undefined
          ? String(review.comment).trim()
          : existing && existing.comment !== undefined
            ? String(existing.comment).trim()
            : '',
      date: new Date(),
    };

    finalMap.set(targetUserId, mergedReview);

    const cleanedReviews = Array.from(finalMap.values());

    // 3. ATOMIC UPDATE: Force replace the entire array in MongoDB
    const mongoRepo =
      this.productsRepository.manager.getMongoRepository(Product);
    await mongoRepo.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { reviews: cleanedReviews } },
    );

    // Fetch fresh and return
    return await this.findOne(productId);
  }

  async toggleReviewLike(
    productId: string,
    reviewUserId: string,
    likerId: string,
    type: string,
  ) {
    const product = await this.findOne(productId);
    if (!product) return null;

    const rawReviews = Array.isArray(product.reviews)
      ? [...product.reviews]
      : [];
    const index = rawReviews.findIndex(
      (r) => String(r.userId) === String(reviewUserId),
    );

    if (index !== -1) {
      const review = rawReviews[index];
      if (!review.reactions) {
        review.reactions = [];
      }

      const likerIndex = review.reactions.findIndex(
        (r) => String(r.userId) === String(likerId),
      );

      if (likerIndex !== -1) {
        // User already reacted
        if (review.reactions[likerIndex].type === type) {
          // Clicked the same reaction type -> remove entirely (unlike)
          review.reactions.splice(likerIndex, 1);
        } else {
          // Switch to a new reaction
          review.reactions[likerIndex].type = type;
        }
      } else {
        // Add new reaction
        review.reactions.push({ userId: String(likerId), type: type });
      }

      rawReviews[index] = review;

      const mongoRepo =
        this.productsRepository.manager.getMongoRepository(Product);
      await mongoRepo.updateOne(
        { _id: new ObjectId(productId) },
        { $set: { reviews: rawReviews } },
      );
    }

    return await this.findOne(productId);
  }
}
