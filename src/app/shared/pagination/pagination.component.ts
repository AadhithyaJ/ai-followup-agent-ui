import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: false,
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage = 1;
  @Input() totalItems  = 0;
  @Input() pageSize    = 10;
  @Output() pageChange = new EventEmitter<number>();

  pages: (number | '...')[] = [];

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startItem(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  ngOnChanges(): void {
    this.pages = this.buildPages();
  }

  goTo(page: number | '...'): void {
    if (page === '...' || page === this.currentPage) return;
    this.pageChange.emit(page as number);
  }

  prev(): void {
    if (this.currentPage > 1) this.pageChange.emit(this.currentPage - 1);
  }

  next(): void {
    if (this.currentPage < this.totalPages) this.pageChange.emit(this.currentPage + 1);
  }

  private buildPages(): (number | '...')[] {
    const total = this.totalPages;
    const cur   = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: (number | '...')[] = [1];
    if (cur > 3)              pages.push('...');
    const lo = Math.max(2, cur - 1);
    const hi = Math.min(total - 1, cur + 1);
    for (let i = lo; i <= hi; i++) pages.push(i);
    if (cur < total - 2)      pages.push('...');
    pages.push(total);
    return pages;
  }
}
