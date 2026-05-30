import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'srx-route-map-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './route-map-preview.component.html',
  styleUrls: ['./route-map-preview.component.scss'],
})
export class RouteMapPreviewComponent implements OnChanges {
  @Input({ required: true }) originLat!: number;
  @Input({ required: true }) originLng!: number;
  @Input({ required: true }) destinationLat!: number;
  @Input({ required: true }) destinationLng!: number;
  @Input() geometry: unknown;
  @Input() height = 240;
  @Input() showFallbackLine = true;
  @Input() darkMode = true;

  mapEmbedUrl: SafeResourceUrl | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['originLat'] ||
      changes['originLng'] ||
      changes['destinationLat'] ||
      changes['destinationLng']
    ) {
      this.updateEmbedUrl();
    }
  }

  refreshMapView(): void {
    this.updateEmbedUrl();
  }

  private updateEmbedUrl(): void {
    const hasCoords = [this.originLat, this.originLng, this.destinationLat, this.destinationLng]
      .every((n) => typeof n === 'number' && !Number.isNaN(n));

    if (!hasCoords) {
      this.mapEmbedUrl = null;
      return;
    }

    const src = `https://www.google.com/maps?saddr=${this.originLat},${this.originLng}&daddr=${this.destinationLat},${this.destinationLng}&output=embed`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
  }
}
