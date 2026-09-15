import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';

import { Propiedad } from '../../propiedades/models/propiedad.model';
import { formatPropiedadInvestment } from '../../propiedades/utils/propiedad-formatters';
import { UnidadFotoView } from '../models/fotografia.model';
import { UnidadResponse } from '../models/unidad.model';
import { prepareUnidadPdfImage } from './unidad-detail-pdf-image';

interface PdfField {
  readonly label: string;
  readonly value: string;
}

const PDF_PAGE_WIDTH = 210;
const PDF_MARGIN_X = 15;
const PDF_TOP = 10;
const PDF_CONTENT_BOTTOM = 279;
const PDF_CONTENT_WIDTH = 180;
const PDF_RIGHT = PDF_MARGIN_X + PDF_CONTENT_WIDTH;
const CARD_RADIUS = 2.5;
const PHOTO_CARD_GAP = 7;
const PHOTO_IMAGE_RATIO = 16 / 9;

const AREA_FORMATTER = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

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
  successSoft: [232, 248, 237] as const,
  dangerSoft: [254, 235, 235] as const,
  white: [255, 255, 255] as const,
};

@Injectable({ providedIn: 'root' })
export class UnidadDetailPdfService {
  async download(
    unit: UnidadResponse,
    property: Propiedad | null,
    photos: readonly UnidadFotoView[] = [],
  ): Promise<void> {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    pdf.setProperties({
      author: 'ORMAN',
      subject: `Ficha de unidad ${unit.nombre}`,
      title: `ORMAN - ${unit.nombre}`,
    });

    let y = PDF_TOP;
    y = this.renderHeader(pdf, y);
    y = this.renderHero(pdf, unit, y);
    y = this.renderIdentificationSection(pdf, unit, y);
    y = this.renderPropertySection(pdf, unit, property, y);
    y = this.renderGeneralSection(pdf, unit, y);
    y = this.renderCharacteristicsSection(pdf, unit, y);
    y = await this.renderPhotosSection(pdf, photos, y);
    y = this.renderLocationSection(pdf, unit, y);
    this.renderFinancialSection(pdf, unit, y);

    this.renderFooters(pdf);
    pdf.save(this.pdfFileName(unit));
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
    pdf.text('Ficha de unidad', PDF_MARGIN_X, y + 25);

    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('Consulta la información registrada de la unidad.', PDF_MARGIN_X, y + 31);

    return y + 37;
  }

  private renderHero(pdf: jsPDF, unit: UnidadResponse, y: number): number {
    const titleLines = this.splitText(pdf, unit.nombre, 118);
    const locationLines = unit.ubicacionInterna
      ? this.splitText(pdf, unit.ubicacionInterna, 164)
      : [];
    const priceLines = this.splitText(pdf, formatPropiedadInvestment(unit.precioBase), 82);
    const identifierLines = this.splitText(pdf, `#${unit.coduni}`, 82);
    const heroHeight = this.heroHeight(
      titleLines.length,
      locationLines.length,
      Math.max(priceLines.length, identifierLines.length),
    );
    const startY = this.ensureSpace(pdf, y, heroHeight);

    this.drawCard(pdf, startY, heroHeight, COLORS.surface);

    let contentY = startY + 7;
    const typeLabel = unit.tipoUnidad.toUpperCase();
    const statusLabel = this.statusLabel(unit.estadoOperativo);

    this.drawBadge(pdf, typeLabel, PDF_MARGIN_X + 7, contentY, COLORS.accentSoft, COLORS.navy);
    this.drawBadge(
      pdf,
      statusLabel,
      PDF_MARGIN_X + 7 + this.badgeWidth(typeLabel) + 3,
      contentY,
      unit.estadoOperativo === 1 ? COLORS.successSoft : COLORS.dangerSoft,
      unit.estadoOperativo === 1 ? COLORS.success : COLORS.danger,
    );

    contentY += 10;
    pdf.setTextColor(...COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(titleLines, PDF_MARGIN_X + 7, contentY);

    contentY += titleLines.length * 4.5 + 2;

    if (locationLines.length > 0) {
      pdf.setTextColor(...COLORS.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.text(locationLines, PDF_MARGIN_X + 7, contentY);
    }

    contentY += (locationLines.length > 0 ? locationLines.length * 3.5 : 0) + 4;
    pdf.setDrawColor(...COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(PDF_MARGIN_X + 7, contentY, PDF_RIGHT - 7, contentY);

    contentY += 5;
    this.drawHeroFact(
      pdf,
      'PRECIO BASE',
      formatPropiedadInvestment(unit.precioBase),
      PDF_MARGIN_X + 7,
      contentY,
    );
    this.drawHeroFact(pdf, 'IDENTIFICADOR', `#${unit.coduni}`, PDF_MARGIN_X + 98, contentY);

    return startY + heroHeight + 5;
  }

  private heroHeight(
    titleLineCount: number,
    locationLineCount: number,
    factLineCount: number,
  ): number {
    const locationHeight = locationLineCount > 0 ? locationLineCount * 3.5 : 0;
    const factHeight = 5 + factLineCount * 4.5 + 5;

    return 7 + 10 + titleLineCount * 4.5 + 2 + locationHeight + 4 + 5 + factHeight;
  }

  private renderIdentificationSection(pdf: jsPDF, unit: UnidadResponse, y: number): number {
    return this.renderSection(
      pdf,
      'Identificación',
      'Datos confirmados de la unidad.',
      [
        [
          { label: 'Nombre', value: unit.nombre },
          { label: 'Tipo de unidad', value: unit.tipoUnidad },
        ],
        [
          { label: 'Estado operativo', value: this.statusLabel(unit.estadoOperativo) },
          { label: 'Identificador de unidad', value: `#${unit.coduni}` },
        ],
      ],
      y,
    );
  }

  private renderPropertySection(
    pdf: jsPDF,
    unit: UnidadResponse,
    property: Propiedad | null,
    y: number,
  ): number {
    const fields: readonly (readonly PdfField[])[] = property
      ? [
          [
            { label: 'Identificador de propiedad', value: `#${unit.codprop}` },
            { label: 'Nombre de la propiedad', value: property.nombre },
          ],
        ]
      : [[{ label: 'Identificador de propiedad', value: `#${unit.codprop}` }]];

    return this.renderSection(
      pdf,
      'Propiedad asociada',
      'Contexto real de pertenencia.',
      fields,
      y,
    );
  }

  private renderGeneralSection(pdf: jsPDF, unit: UnidadResponse, y: number): number {
    return this.renderSection(
      pdf,
      'Información general',
      'Descripción registrada para la unidad.',
      [[{ label: 'Descripción', value: this.optionalLabel(unit.descripcion) }]],
      y,
    );
  }

  private renderCharacteristicsSection(pdf: jsPDF, unit: UnidadResponse, y: number): number {
    return this.renderSection(
      pdf,
      'Características',
      'Medidas y distribución registradas.',
      [
        [
          { label: 'Área', value: this.formatArea(unit.area) },
          { label: 'Dormitorios', value: String(unit.dormitorios) },
        ],
        [
          { label: 'Baños', value: String(unit.banos) },
          { label: 'Piso', value: String(unit.piso) },
        ],
      ],
      y,
    );
  }

  private async renderPhotosSection(
    pdf: jsPDF,
    photos: readonly UnidadFotoView[],
    y: number,
  ): Promise<number> {
    if (photos.length === 0) {
      return y;
    }

    const headingHeight = 16;
    const headingY = this.ensureSpace(pdf, y, headingHeight);
    this.drawCard(pdf, headingY, headingHeight, COLORS.white);
    this.drawPhotosHeading(pdf, headingY);

    const columnWidth = this.sectionColumnWidth(2);
    let rowY = headingY + headingHeight + 4;

    for (let index = 0; index < photos.length; index += 2) {
      const rowPhotos = photos.slice(index, index + 2);
      const rowHeight = Math.max(
        ...rowPhotos.map((photo) => this.photoCardHeight(pdf, photo, columnWidth)),
      );
      const rowStartY = this.ensureSpace(pdf, rowY, rowHeight);

      await Promise.all(
        rowPhotos.map((photo, columnIndex) =>
          this.renderPhotoCard(
            pdf,
            photo,
            PDF_MARGIN_X + 7 + columnIndex * (columnWidth + PHOTO_CARD_GAP),
            rowStartY,
            columnWidth,
            rowHeight,
          ),
        ),
      );

      rowY = rowStartY + rowHeight + 5;
    }

    return rowY + 1;
  }

  private drawPhotosHeading(pdf: jsPDF, y: number): void {
    pdf.setTextColor(...COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.text('Fotografías de la unidad', PDF_MARGIN_X + 7, y + 5.5);

    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.3);
    pdf.text('Ambientes registrados en la unidad.', PDF_MARGIN_X + 7, y + 8.8);

    pdf.setDrawColor(...COLORS.accent);
    pdf.setLineWidth(0.55);
    pdf.line(PDF_MARGIN_X + 7, y + 11, PDF_RIGHT - 7, y + 11);
  }

  private photoCardHeight(pdf: jsPDF, photo: UnidadFotoView, width: number): number {
    const textWidth = width - 6;
    const titleLines = this.splitText(pdf, this.photoTitle(photo), textWidth);
    const environmentLines =
      photo.titulo?.trim() && photo.ambiente?.trim()
        ? this.splitText(pdf, photo.ambiente, textWidth)
        : [];
    const imageHeight = this.photoImageHeight(width);
    const titleHeight = Math.max(1, titleLines.length) * 3.7;
    const environmentHeight = environmentLines.length > 0 ? 3 + environmentLines.length * 3.2 : 0;

    return imageHeight + 6 + titleHeight + environmentHeight + 4;
  }

  private async renderPhotoCard(
    pdf: jsPDF,
    photo: UnidadFotoView,
    x: number,
    y: number,
    width: number,
    height: number,
  ): Promise<void> {
    this.drawCard(pdf, y, height, COLORS.surface);

    const imageHeight = this.photoImageHeight(width);
    const image = photo.imageUrl ? await prepareUnidadPdfImage(photo.imageUrl) : null;

    if (image) {
      pdf.addImage(image.dataUrl, image.format, x + 0.5, y + 0.5, width - 1, imageHeight - 1);
    } else {
      this.drawPhotoPlaceholder(pdf, x, y, width, imageHeight);
    }

    if (photo.portada) {
      this.drawBadge(pdf, 'PORTADA', x + 3, y + 6, COLORS.accentSoft, COLORS.accent);
    }

    const textWidth = width - 6;
    const titleLines = this.splitText(pdf, this.photoTitle(photo), textWidth);
    const titleY = y + imageHeight + 6;
    pdf.setTextColor(...COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.8);
    pdf.text(titleLines, x + 3, titleY);

    if (photo.titulo?.trim() && photo.ambiente?.trim()) {
      const environmentLines = this.splitText(pdf, photo.ambiente, textWidth);
      pdf.setTextColor(...COLORS.muted);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(environmentLines, x + 3, titleY + titleLines.length * 3.7 + 3);
    }
  }

  private drawPhotoPlaceholder(
    pdf: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    pdf.setTextColor(...COLORS.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Imagen no disponible', x + width / 2, y + height / 2, { align: 'center' });
  }

  private photoImageHeight(width: number): number {
    return width / PHOTO_IMAGE_RATIO;
  }

  private photoTitle(photo: UnidadFotoView): string {
    return photo.titulo?.trim() || photo.ambiente?.trim() || 'Fotografía de la unidad';
  }

  private renderLocationSection(pdf: jsPDF, unit: UnidadResponse, y: number): number {
    return this.renderSection(
      pdf,
      'Ubicación interna',
      'Referencia registrada dentro de la propiedad.',
      [[{ label: 'Ubicación interna', value: this.optionalLabel(unit.ubicacionInterna) }]],
      y,
    );
  }

  private renderFinancialSection(pdf: jsPDF, unit: UnidadResponse, y: number): number {
    return this.renderSection(
      pdf,
      'Información financiera',
      'Valor base registrado para la unidad.',
      [[{ label: 'Precio base', value: formatPropiedadInvestment(unit.precioBase) }]],
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
    pdf.text(this.splitText(pdf, value, 82), x, y + 5);
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
    background: readonly [number, number, number],
    textColor: readonly [number, number, number],
  ): void {
    const width = this.badgeWidth(label);

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

  private optionalLabel(value: string | null): string {
    return value?.trim() || 'No registrada';
  }

  private statusLabel(status: number): string {
    return status === 1 ? 'OPERATIVA' : 'NO OPERATIVA';
  }

  private formatArea(area: number): string {
    return `${AREA_FORMATTER.format(area)} m²`;
  }

  private badgeWidth(label: string): number {
    return Math.max(20, label.length * 1.8 + 6);
  }

  private pdfFileName(unit: UnidadResponse): string {
    const normalizedName = unit.nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `ORMAN-Unidad-${unit.coduni}-${normalizedName || 'Detalle'}.pdf`;
  }
}
