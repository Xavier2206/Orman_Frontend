import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';

import { PROPERTY_MAP_CONFIG } from '../../data/propiedad-location-map.config';
import { PropiedadCoordinates } from '../../models/propiedad-location.model';

@Component({
  selector: 'app-propiedad-location-map',
  templateUrl: './propiedad-location-map.component.html',
  styleUrl: './propiedad-location-map.component.css',
})
export class PropiedadLocationMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() coordinates: PropiedadCoordinates | null = null;
  @Input() readOnly = false;
  @Output() readonly coordinatesSelected = new EventEmitter<PropiedadCoordinates>();
  @ViewChild('mapHost', { static: true }) private readonly mapHost!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private readonly markerIcon = L.icon({
    iconRetinaUrl: PROPERTY_MAP_CONFIG.markerIconRetinaUrl,
    iconUrl: PROPERTY_MAP_CONFIG.markerIconUrl,
    shadowUrl: PROPERTY_MAP_CONFIG.markerShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  ngAfterViewInit(): void {
    this.map = L.map(this.mapHost.nativeElement, {
      center: PROPERTY_MAP_CONFIG.defaultCenter,
      zoom: PROPERTY_MAP_CONFIG.defaultZoom,
      zoomControl: true,
      attributionControl: true,
      keyboard: true,
    });

    L.tileLayer(PROPERTY_MAP_CONFIG.tileUrl, {
      attribution: PROPERTY_MAP_CONFIG.attribution,
      maxZoom: 19,
    }).addTo(this.map);
    if (!this.readOnly) {
      this.map.on('click', this.handleMapClick);
    }

    this.syncMapToCoordinates();

    setTimeout(() => this.map?.invalidateSize({ pan: false }), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coordinates'] && this.map) {
      this.syncMapToCoordinates();
    }
  }

  ngOnDestroy(): void {
    this.map?.off('click', this.handleMapClick);
    this.marker?.off('dragend', this.handleMarkerDragEnd);
    this.map?.remove();
    this.marker = null;
    this.map = null;
  }

  private syncMapToCoordinates(): void {
    if (!this.map) {
      return;
    }

    if (!this.coordinates) {
      this.removeMarker();
      this.map.setView(PROPERTY_MAP_CONFIG.defaultCenter, PROPERTY_MAP_CONFIG.defaultZoom, {
        animate: false,
      });
      return;
    }

    const location = L.latLng(this.coordinates.latitud, this.coordinates.longitud);

    if (!this.marker) {
      this.marker = L.marker(location, {
        draggable: !this.readOnly,
        icon: this.markerIcon,
        autoPan: !this.readOnly,
      }).addTo(this.map);

      if (!this.readOnly) {
        this.marker.on('dragend', this.handleMarkerDragEnd);
      }
    } else {
      const currentLocation = this.marker.getLatLng();

      if (
        currentLocation.lat !== this.coordinates.latitud ||
        currentLocation.lng !== this.coordinates.longitud
      ) {
        this.marker.setLatLng(location);
      }
    }

    this.map.setView(location, Math.max(this.map.getZoom(), PROPERTY_MAP_CONFIG.selectedZoom), {
      animate: false,
    });
  }

  private readonly handleMapClick = (event: L.LeafletMouseEvent): void => {
    if (this.readOnly) {
      return;
    }

    this.emitCoordinates(event.latlng.lat, event.latlng.lng);
  };

  private readonly handleMarkerDragEnd = (): void => {
    if (this.readOnly) {
      return;
    }

    const location = this.marker?.getLatLng();

    if (location) {
      this.emitCoordinates(location.lat, location.lng);
    }
  };

  private emitCoordinates(latitud: number, longitud: number): void {
    this.coordinatesSelected.emit({
      latitud: Number(latitud.toFixed(7)),
      longitud: Number(longitud.toFixed(7)),
    });
  }

  private removeMarker(): void {
    if (this.marker) {
      this.marker.off('dragend', this.handleMarkerDragEnd);
      this.marker.remove();
      this.marker = null;
    }
  }
}
