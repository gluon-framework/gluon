export default async (CDP, evaluate, { pageLoadPromise }) => {
  return {
    eval: evaluate,
    loaded: pageLoadPromise,

    title: val => {
      if (!val) return evaluate('document.title');
      return evaluate(`document.title = \`${val}\``);
    },

    reload: async (ignoreCache = false) => {
      await CDP.send('Page.reload', {
        ignoreCache
      });
    },

    printToPDF: async (options = {}) => {
      if (options.margins) {
        const { top, bottom, left, right } = options.margins;
        options.marginTop = top;
        options.marginBottom = bottom;
        options.marginLeft = left;
        options.marginRight = right;

        delete options.margins;
      }

      const { data } = await CDP.send('Page.printToPDF', options);
      const buffer = Buffer.from(data, 'base64');

      return buffer;
    }
  };
};