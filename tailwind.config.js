// tailwind.config.js
module.exports = {
  future: {
    purgeLayersByDefault: true, removeDeprecatedGapUtilities: true,
  },
  purge: {
    mode: 'all',
    content: ['views/*.ejs', 'views/**/*.ejs'],
    enabled: true,
  },
  theme: {
    cursor: {
      auto: 'auto',
      default: 'default',
      pointer: 'pointer',
      text: 'text',
      help: 'help',

    },
  },
};
