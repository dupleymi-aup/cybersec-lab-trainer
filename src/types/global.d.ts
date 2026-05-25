declare module 'react-syntax-highlighter' {
  import { ComponentType, CSSProperties } from 'react';

  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: string;
    customStyle?: CSSProperties;
    codeTagProps?: CSSProperties;
    useInlineStyles?: boolean;
    showLineNumbers?: boolean;
    startingLineNumber?: number;
    lineNumberStyle?: CSSProperties | ((lineNumber: number) => CSSProperties);
    wrapLines?: boolean;
    lineProps?: CSSProperties | ((lineNumber: number) => CSSProperties);
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
  export default Prism;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import { CSSProperties } from 'react';
  export const oneDark: { [key: string]: CSSProperties };
}
