import { Module } from '@nestjs/common'
import { RankController } from './rank.controller'
import { RankService } from './rank.service'
import { ArticlesModule } from '../articles/articles.module'

@Module({
  imports: [ArticlesModule],
  controllers: [RankController],
  providers: [RankService],
})
export class RankModule {}
