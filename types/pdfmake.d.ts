// Этот файл сохранен для обратной совместимости, но больше не используется
// PDF-формирование отчетов заменено на веб-отчеты

declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: {
    pdfMake: {
      vfs: any;
    };
  };
  export default pdfFonts;
}

declare module 'pdfmake/interfaces' {
  export interface TDocumentDefinitions {
    content: Content;
    styles?: any;
    defaultStyle?: any;
    pageSize?: string | {
      width: number;
      height: number;
    };
    pageOrientation?: string;
    pageMargins?: [number, number, number, number];
    info?: TDocumentInformation;
    [propName: string]: any;
  }

  export interface TDocumentInformation {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    [propName: string]: any;
  }

  export type Content = (
    | string
    | {
        text?: string;
        style?: string | string[];
        margin?: [number, number, number, number] | number;
        [propName: string]: any;
      }
    | {
        table: {
          body: any[][];
          widths?: (string | number)[];
          heights?: (string | number)[];
          headerRows?: number;
          [propName: string]: any;
        };
        [propName: string]: any;
      }
    | Content[]
  );
} 