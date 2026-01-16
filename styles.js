import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    min-height: 100%;
  }

  body {
    font-family: system-ui;
    background: linear-gradient(
      180deg,
      #fed6e3 0%,
      #a8edea 100%
    );
    background-attachment: fixed;
  }

  #__next {
    min-height: 100%;
  }
`;
