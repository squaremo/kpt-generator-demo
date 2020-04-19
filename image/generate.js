import { core, apps } from '@jkcfg/kubernetes/api';
import { log, read, write, stdin, stdout, Format } from '@jkcfg/std';
import { stringify } from '@jkcfg/std';
import { merge } from '@jkcfg/std/merge';

// This script can be run without building the image:
//
//    kpt source . | jk --lib jkcfg/kubernetes:0.6.2 ./image/generate.js

class ResourceList {
  constructor(items) {
    this.items = items;
    this.kind = 'ResourceList';
    this.apiVersion = 'config.kubernetes.io/v1beta1';
  }
}

const app = 'helloworld';
const functionConfigName = 'generate';
const generateImage = 'generate';

// In case some values are not supplied in the functionConfig.
const defaultData = {
  namespace: 'default',
  image: 'helloworld',
};

async function main() {
  const input = await read(stdin, { format: Format.YAML });


  const { functionConfig = {} } = input;
  const config = Object.assign({}, defaultData, functionConfig.data || {});
  const { namespace, image } = config;

  log(config);

  const items = [
    new apps.v1.Deployment('helloworld', {
      metadata: { namespace },
      spec: {
        selector: {
          matchLabels: { app },
        },
        template: {
          metadata: {
            labels: { app },
          },
          spec: {
            containers: [
              { image }
            ],
          },
        },
      },
    }),

    new core.v1.Service('helloworld', {
      metadata: { namespace },
      spec: {
        selector: {
          matchLabels: { app },
        },
        ports: [
          { port: 80 },
        ],
      },
    }),
  ];

  const rl = new ResourceList(items);
  log(rl);
  write(rl, stdout, { format: Format.YAML });
}

main();
