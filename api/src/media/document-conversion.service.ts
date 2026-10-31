import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import sanitizeHtml from 'sanitize-html';
import { MediaService } from './media.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['.docx', '.pdf'];

@Injectable()
export class DocumentConversionService {
  constructor(private readonly mediaService: MediaService) {}

  async convert(file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException('A document file is required.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Maximum file size is 10 MB.');
    }

    const extension = extname(file.originalname).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException('Only DOCX and PDF files are supported.');
    }

    const html =
      extension === '.docx'
        ? await this.convertDocx(file.buffer)
        : await this.convertPdf(file.buffer);

    const sanitizedHtml = sanitizeHtml(html, {
      allowedTags: [
        'p',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'strong',
        'b',
        'em',
        'i',
        'u',
        's',
        'ul',
        'ol',
        'li',
        'blockquote',
        'a',
        'img',
        'br',
        'hr',
        'pre',
        'code',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
      ],
      allowedAttributes: {
        a: ['href', 'title'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        th: ['colspan', 'rowspan'],
        td: ['colspan', 'rowspan'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      allowProtocolRelative: false,
    });

    if (!sanitizedHtml.trim()) {
      throw new BadRequestException(
        'No readable content was found in the document.',
      );
    }

    return {
      filename: file.originalname,
      format: extension.slice(1),
      html: sanitizedHtml,
    };
  }

  private async convertDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.convertToHtml(
        { buffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            const imageBuffer = await image.read();

            const media = await this.mediaService.saveEmbeddedImage(
              Buffer.from(imageBuffer),
              `document-image.${image.contentType.split('/')[1] ?? 'png'}`,
            );

            return {
              src: media.url,
            };
          }),
        },
      );

      return result.value;
    } catch {
      throw new BadRequestException('Unable to read this DOCX document.');
    }
  }

  private async convertPdf(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();

      const paragraphs = result.text
        .replace(/\r/g, '')
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

      return paragraphs
        .map((paragraph) => {
          const escaped = this.escapeHtml(paragraph).replace(/\n/g, '<br>');
          return `<p>${escaped}</p>`;
        })
        .join('');
    } catch {
      throw new BadRequestException(
        'Unable to extract text from this PDF document.',
      );
    } finally {
      await parser.destroy();
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
