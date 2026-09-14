import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

import { Propiedad } from '../models/propiedad.model';
import { formatPropiedadInvestment } from '../utils/propiedad-formatters';

type PdfImageFormat = 'JPEG' | 'PNG';

interface PdfField {
  readonly label: string;
  readonly value: string;
}

interface PdfImage {
  readonly dataUrl: string;
  readonly format: PdfImageFormat;
}

const COORDINATE_FORMATTER = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 7,
});

const PDF_PAGE_WIDTH = 210;
const PDF_MARGIN_X = 15;
const PDF_TOP = 10;
const PDF_CONTENT_BOTTOM = 279;
const PDF_CONTENT_WIDTH = 180;
const PDF_RIGHT = PDF_MARGIN_X + PDF_CONTENT_WIDTH;
const COVER_HEIGHT = 46;
const CARD_RADIUS = 2.5;

const COLORS = {
  accent: [212, 169, 78] as const,
  accentSoft: [255, 248, 231] as const,
  navy: [0, 15, 31] as const,
  text: [17, 24, 39] as const,
  muted: [82, 96, 109] as const,
  border: [217, 224, 230] as const,
  surface: [244, 246, 248] as const,
  success: [22, 163, 74] as const,
  danger: [220, 38, 38] as const,
  white: [255, 255, 255] as const,
};

@Injectable({ providedIn: 'root' })
export class PropiedadDetailPdfService {
  async download(property: Propiedad, cover: Blob | null): Promise<void> {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    pdf.setProperties({
      author: 'ORMAN',
      subject: `Detalle de propiedad ${property.nombre}`,
      title: `ORMAN - ${property.nombre}`,
    });

    let y = PDF_TOP;
    y = this.renderHeader(pdf, y);
    y = await this.renderCover(pdf, cover, property.tienePortada, y);
    y = this.renderHero(pdf, property, y);
    y = this.renderGeneralSection(pdf, property, y);
    y = this.renderLocationSection(pdf, property, y);
    y = this.renderFinancialSection(pdf, property, y);
    this.renderOperationalSection(pdf, property, y);

    this.renderFooters(pdf);
    pdf.save(this.pdfFileName(property));
  }

  private renderHeader(pdf: jsPDF, y: number): number {
    pdf.setTextColor(...COLORS.navy);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('ORMAN', PDF_MARGIN_X, y + 4);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text('GESTIÓN DE PROPIEDADES', PDF_MARGIN_X + 32, y + 4);

    pdf.setDrawColor(...COLORS.accent);
    pdf.setLineWidth(0.7);
    pdf.line(PDF_MARGIN_X, y + 8, PDF_RIGHT, y + 8);

    pdf.setTextColor(...COLORS.accent);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text('GESTIÓN INMOBILIARIA', PDF_MARGIN_X, y + 17);

    pdf.setTextColor(...COLORS.text);
    pdf.setFontSize(19);
    pdf.text('Detalle de propiedad', PDF_MARGIN_X, y + 25);

    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Consulta la información registrada del inmueble.', PDF_MARGIN_X, y + 31);

    return y + 37;
  }

  private async renderCover(
    pdf: jsPDF,
    cover: Blob | null,
    hasCover: boolean,
    y: number,
  ): Promise<number> {
    const startY = this.ensureSpace(pdf, y, COVER_HEIGHT);
    this.drawCard(pdf, startY, COVER_HEIGHT, COLORS.surface);

    if (cover) {
      const image = await this.prepareCoverImage(cover);
      pdf.addImage(
        image.dataUrl,
        image.format,
        PDF_MARGIN_X + 0.5,
        startY + 0.5,
        PDF_CONTENT_WIDTH - 1,
        COVER_HEIGHT - 1,
      );
    } else {
      pdf.setTextColor(...COLORS.accent);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(
        hasCover ? 'PORTADA NO DISPONIBLE' : 'SIN PORTADA REGISTRADA',
        PDF_PAGE_WIDTH / 2,
        startY + COVER_HEIGHT / 2,
        { align: 'center' },
      );
      pdf.setTextColor(...COLORS.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(
        'La propiedad puede consultarse sin fotografía principal.',
        PDF_PAGE_WIDTH / 2,
        startY + 29,
        { align: 'center' },
      );
    }

    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(
      PDF_MARGIN_X,
      startY,
      PDF_CONTENT_WIDTH,
      COVER_HEIGHT,
      CARD_RADIUS,
      CARD_RADIUS,
      'S',
    );

    return startY + COVER_HEIGHT + 5;
  }

  private renderHero(pdf: jsPDF, property: Propiedad, y: number): number {
    const titleLines = this.splitText(pdf, property.nombre, 118);
    const locationLines = this.splitText(pdf, `${property.direccion}, ${property.ciudad}`, 164);
    const heroHeight =
      41 + Math.max(0, titleLines.length - 1) * 4.5 + Math.max(0, locationLines.length - 1) * 3.5;
    const startY = this.ensureSpace(pdf, y, heroHeight);

    this.drawCard(pdf, startY, heroHeight, COLORS.surface);

    let contentY = startY + 7;
    const typeLabel = this.typeLabel(property.tipo).toUpperCase();
    const statusLabel = this.statusLabel(property.estado).toUpperCase();
    const typeWidth = typeLabel === 'EDIFICIO' ? 26 : 19;
    const statusWidth = statusLabel === 'INACTIVA' ? 24 : 20;

    this.drawBadge(
      pdf,
      typeLabel,
      PDF_MARGIN_X + 7,
      contentY,
      typeWidth,
      COLORS.accentSoft,
      COLORS.navy,
    );
    this.drawBadge(
      pdf,
      statusLabel,
      PDF_MARGIN_X + 7 + typeWidth + 3,
      contentY,
      statusWidth,
      property.estado === 1 ? [232, 248, 237] : [254, 235, 235],
      property.estado === 1 ? COLORS.success : COLORS.danger,
    );

    contentY += 10;
    pdf.setTextColor(...COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(titleLines, PDF_MARGIN_X + 7, contentY);

    contentY += titleLines.length * 4.5 + 2;
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text(locationLines, PDF_MARGIN_X + 7, contentY);

    contentY += locationLines.length * 3.5 + 4;
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(PDF_MARGIN_X + 7, contentY, PDF_RIGHT - 7, contentY);

    contentY += 5;
    this.drawHeroFact(
      pdf,
      'INVERSIÓN INICIAL',
      formatPropiedadInvestment(property.inversionInicial),
      PDF_MARGIN_X + 7,
      contentY,
    );
    this.drawHeroFact(pdf, 'IDENTIFICADOR', `#${property.codprop}`, PDF_MARGIN_X + 98, contentY);

    return startY + heroHeight + 5;
  }

  private renderGeneralSection(pdf: jsPDF, property: Propiedad, y: number): number {
    return this.renderSection(
      pdf,
      'Datos generales',
      'Información de identificación y ubicación registrada.',
      [
        [
          { label: 'Nombre del inmueble', value: property.nombre },
          { label: 'Tipo de propiedad', value: this.typeLabel(property.tipo) },
        ],
        [{ label: 'Dirección', value: property.direccion }],
        [
          { label: 'Ciudad', value: property.ciudad },
          { label: 'Referencia', value: this.referenceLabel(property.referencia) },
        ],
      ],
      y,
    );
  }

  private renderLocationSection(pdf: jsPDF, property: Propiedad, y: number): number {
    const fields: readonly PdfField[][] =
      property.latitud !== null && property.longitud !== null
        ? [
            [
              { label: 'Latitud', value: this.formatCoordinate(property.latitud) },
              { label: 'Longitud', value: this.formatCoordinate(property.longitud) },
            ],
          ]
        : [[{ label: 'Coordenadas', value: 'No registradas' }]];

    return this.renderSection(
      pdf,
      'Ubicación',
      'Coordenadas registradas para consulta cartográfica.',
      fields,
      y,
    );
  }

  private renderFinancialSection(pdf: jsPDF, property: Propiedad, y: number): number {
    return this.renderSection(
      pdf,
      'Datos financieros',
      'Valor registrado para el inmueble.',
      [
        [
          {
            label: 'Inversión inicial',
            value: formatPropiedadInvestment(property.inversionInicial),
          },
        ],
      ],
      y,
    );
  }

  private renderOperationalSection(pdf: jsPDF, property: Propiedad, y: number): number {
    return this.renderSection(
      pdf,
      'Resumen operativo',
      'Métrica disponible en el detalle de la propiedad.',
      [[{ label: 'Unidades registradas', value: this.unitCountLabel(property.cantidadUnidades) }]],
      y,
    );
  }

  private renderSection(
    pdf: jsPDF,
    title: string,
    subtitle: string,
    rows: readonly (readonly PdfField[])[],
    y: number,
  ): number {
    const rowHeights = rows.map((row) => {
      const columnWidth = this.sectionColumnWidth(row.length);

      return Math.max(...row.map((field) => this.fieldHeight(pdf, field.value, columnWidth)));
    });
    const sectionHeight =
      12 +
      rowHeights.reduce((total, height) => total + height, 0) +
      Math.max(0, rows.length - 1) * 1.5 +
      4;
    const startY = this.ensureSpace(pdf, y, sectionHeight);

    this.drawCard(pdf, startY, sectionHeight, COLORS.white);

    pdf.setTextColor(...COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.text(title, PDF_MARGIN_X + 7, startY + 5.5);

    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.3);
    pdf.text(subtitle, PDF_MARGIN_X + 7, startY + 8.8);

    pdf.setDrawColor(...COLORS.accent);
    pdf.setLineWidth(0.55);
    pdf.line(PDF_MARGIN_X + 7, startY + 11, PDF_RIGHT - 7, startY + 11);

    let rowY = startY + 14;
    rows.forEach((row, rowIndex) => {
      const columnWidth = this.sectionColumnWidth(row.length);
      const gap = row.length > 1 ? 7 : 0;

      row.forEach((field, fieldIndex) => {
        const x = PDF_MARGIN_X + 7 + fieldIndex * (columnWidth + gap);
        this.drawField(pdf, field, x, rowY, columnWidth);
      });

      rowY += rowHeights[rowIndex] + (rowIndex < rows.length - 1 ? 1.5 : 0);
    });

    return startY + sectionHeight + 4;
  }

  private drawHeroFact(pdf: jsPDF, label: string, value: string, x: number, y: number): void {
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.text(label, x, y);

    pdf.setTextColor(...COLORS.text);
    pdf.setFontSize(9.5);
    pdf.text(value, x, y + 5);
  }

  private drawField(pdf: jsPDF, field: PdfField, x: number, y: number, width: number): void {
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.1);
    pdf.text(field.label.toUpperCase(), x, y);

    pdf.setTextColor(...COLORS.text);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.2);
    pdf.text(this.splitText(pdf, field.value, width), x, y + 4.2);
  }

  private drawBadge(
    pdf: jsPDF,
    label: string,
    x: number,
    y: number,
    width: number,
    background: readonly [number, number, number],
    textColor: readonly [number, number, number],
  ): void {
    pdf.setFillColor(...background);
    pdf.roundedRect(x, y - 4.5, width, 6.5, 3, 3, 'F');
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.text(label, x + width / 2, y - 0.2, { align: 'center' });
  }

  private drawCard(
    pdf: jsPDF,
    y: number,
    height: number,
    background: readonly [number, number, number],
  ): void {
    pdf.setFillColor(...background);
    pdf.roundedRect(PDF_MARGIN_X, y, PDF_CONTENT_WIDTH, height, CARD_RADIUS, CARD_RADIUS, 'F');
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(PDF_MARGIN_X, y, PDF_CONTENT_WIDTH, height, CARD_RADIUS, CARD_RADIUS, 'S');
  }

  private renderFooters(pdf: jsPDF): void {
    const pageCount = pdf.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);
      pdf.setDrawColor(...COLORS.border);
      pdf.setLineWidth(0.3);
      pdf.line(PDF_MARGIN_X, 285, PDF_RIGHT, 285);
      pdf.setTextColor(...COLORS.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.text('Generado desde ORMAN - Gestión de Propiedades', PDF_MARGIN_X, 290);
      pdf.text(`Página ${page} de ${pageCount}`, PDF_RIGHT, 290, { align: 'right' });
    }
  }

  private ensureSpace(pdf: jsPDF, y: number, requiredHeight: number): number {
    if (y + requiredHeight <= PDF_CONTENT_BOTTOM) {
      return y;
    }

    pdf.addPage();

    return PDF_TOP;
  }

  private sectionColumnWidth(columnCount: number): number {
    return columnCount > 1 ? (PDF_CONTENT_WIDTH - 14 - 7) / 2 : PDF_CONTENT_WIDTH - 14;
  }

  private fieldHeight(pdf: jsPDF, value: string, width: number): number {
    const lines = this.splitText(pdf, value, width);

    return 7.8 + Math.max(0, lines.length - 1) * 3.5;
  }

  private splitText(pdf: jsPDF, value: string, width: number): string[] {
    return pdf.splitTextToSize(value || 'No registrada', width) as string[];
  }

  private typeLabel(type: Propiedad['tipo']): string {
    return type === 'EDIFICIO' ? 'Edificio' : 'Casa';
  }

  private statusLabel(status: Propiedad['estado']): string {
    return status === 1 ? 'Activa' : 'Inactiva';
  }

  private formatCoordinate(value: number): string {
    return COORDINATE_FORMATTER.format(value);
  }

  private referenceLabel(reference: string | null): string {
    return reference?.trim() || 'No registrada';
  }

  private unitCountLabel(count: number): string {
    return `${count} ${count === 1 ? 'unidad registrada' : 'unidades registradas'}`;
  }

  private async prepareCoverImage(cover: Blob): Promise<PdfImage> {
    const source = await this.blobToDataUrl(cover);
    const canvas = this.createCoverCanvas();

    if (!canvas) {
      return { dataUrl: source, format: this.imageFormat(cover) };
    }

    const context = canvas.getContext('2d');

    if (!context || typeof Image === 'undefined') {
      return { dataUrl: source, format: this.imageFormat(cover) };
    }

    const image = await this.loadImage(source);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      return { dataUrl: source, format: this.imageFormat(cover) };
    }

    const scale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    context.fillStyle = '#f4f6f8';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    return { dataUrl: canvas.toDataURL('image/jpeg', 0.9), format: 'JPEG' };
  }

  private createCoverCanvas(): HTMLCanvasElement | null {
    if (typeof document === 'undefined') {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');

      canvas.width = 1440;
      canvas.height = Math.round((1440 * COVER_HEIGHT) / PDF_CONTENT_WIDTH);

      if (!canvas.getContext('2d')) {
        return null;
      }

      return canvas;
    } catch {
      return null;
    }
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No fue posible preparar la portada para el PDF.'));
      image.src = source;
    });
  }

  private imageFormat(cover: Blob): PdfImageFormat {
    return cover.type === 'image/png' ? 'PNG' : 'JPEG';
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('No fue posible leer la portada para el PDF.'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('No fue posible leer la portada.'));
      reader.readAsDataURL(blob);
    });
  }

  private pdfFileName(property: Propiedad): string {
    const normalizedType = this.typeLabel(property.tipo);
    const normalizedName = property.nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const typePrefix = `${normalizedType}-`;
    const propertyName = normalizedName.toLowerCase().startsWith(typePrefix.toLowerCase())
      ? normalizedName.slice(typePrefix.length)
      : normalizedName;

    return `ORMAN-Propiedad-${normalizedType}-${propertyName || 'Detalle'}.pdf`;
  }
}
