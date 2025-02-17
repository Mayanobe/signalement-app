import { Component, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {

  articleUrl: string;

  constructor(private markdownService: MarkdownService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
        this.articleUrl = `/assets/blog/${params.get('year')}/${params.get('month')}/${params.get('day')}/${params.get('article')}/${params.get('article')}.md`;
      }
    );
  }
}
