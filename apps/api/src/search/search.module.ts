import { Global, Module } from '@nestjs/common'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { ArticlesModule } from '../articles/articles.module'

@Global()
@Module({
  imports: [ArticlesModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
