import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: '../front-end/public/assets/images/products',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `product-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      return { error: 'No file uploaded' };
    }
    return {
      message: 'File uploaded successfully',
      filename: file.filename,
      path: `/assets/images/products/${file.filename}`,
    };
  }

  @Get('FindAll')
  findAll() {
    return this.productsService.findAll();
  }

  @Get('BySupplier/:supplierId')
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.productsService.findBySupplier(supplierId);
  }

  @Get('Find/:id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch('Update/:id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete('Delete/:id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Post('AddReview/:id')
  addReview(
    @Param('id') id: string,
    @Body()
    review: {
      userId: string;
      userName: string;
      rating: number;
      comment: string;
    },
  ) {
    return this.productsService.addReview(id, review);
  }

  @Post('ToggleLikeReview/:id')
  toggleLikeReview(
    @Param('id') id: string,
    @Body() body: { reviewUserId: string; likerId: string; type: string },
  ) {
    return this.productsService.toggleReviewLike(
      id,
      body.reviewUserId,
      body.likerId,
      body.type || 'like',
    );
  }
}
