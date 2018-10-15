const express = require('express');
const babel = require('@babel/core');
const { promisify } = require('util');
const path = require('path');

const transformFile = promisify(babel.transformFile.bind(babel));

const vendorRouter = express.Router();

const getScript = filepath => async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, filepath));
};

vendorRouter.get(
  '/react',
  getScript('../node_modules/react/umd/react.development.js')
);

vendorRouter.get(
  '/react-dom',
  getScript('../node_modules/react-dom/umd/react-dom.development.js')
);

async function start() {
  try {
    const app = express();

    app.use('/app/*', async (req, res) => {
      const { 0: filename } = req.params;
      res.type(filename.split('.').pop());

      if (filename.endsWith('.js')) {
        const { code } = await transformFile(`src/app/${filename}`, {
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  esmodules: true
                },
                modules: false
              }
            ],
            '@babel/preset-react'
          ]
        });

        return res.send(code);
      }

      return res.sendFile(path.join(__dirname, 'app', filename));
    });

    app.use('/vendor', vendorRouter);

    app.use(express.static('src/public'));

    app.listen(1337);
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error(err);
    process.exit(1);
  }
}

start();
