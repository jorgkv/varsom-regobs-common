import { ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export function markForCheck<T>(cdr: ChangeDetectorRef): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => source.pipe(tap(() => cdr.markForCheck()));
}
