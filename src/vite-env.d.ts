/// <reference types="vite/client" />

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const styles: { [key: string]: { [key: string]: React.CSSProperties } };
  export const oneDark: any;
  export default styles;
}
declare module 'react-syntax-highlighter/dist/esm/languages/prism/*' {
  const lang: any;
  export default lang;
}
