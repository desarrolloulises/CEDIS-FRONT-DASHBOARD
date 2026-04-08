import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(url: string | null): SafeResourceUrl {
    if (!url) return '';
    // Esto le dice a Angular: "Confío en esta URL, déjala pasar al iframe"
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}