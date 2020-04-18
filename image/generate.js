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

async function main() {
  const input = await read(stdin, { format: Format.YAML });

  // If run using `kpt fn run . --image=generate`, this'll get a
  // functionConfig made for it by `kpt fn`. I can use that as a
  // bootstrapping mechanism, by including it in the resources output
  // so it's written to the directory. The generation step can then be
  // invoked with `kpt fn run .` the next time.
  const defaultData = {
    namespace: 'default',
    image: 'helloworld',
  };

  // If run using `kpt source . | jk run ./image/generate.js` there
  // will be no function config; this constructs a default for that
  // situation.
  const defaultFunctionConfig = new core.v1.ConfigMap(functionConfigName, {
    metadata: {
      annotations: {
        'config.k8s.io/function': stringify({
          container: {
            image: generateImage,
          },
        }, Format.YAML),
      },
    },
    data: defaultData,
  });

  const { functionConfig = defaultFunctionConfig } = input;
  const config = Object.assign({}, defaultData, functionConfig.data || {});
  const { namespace, image } = config;

  log(config);

  // unconditionally set the functionConfig name to something I like
  const functionConfigResource = merge(functionConfig, {
    metadata: {
      name: functionConfigName,
    },
  });

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

    functionConfigResource,
  ];
  const rl = new ResourceList(items);
  log(rl);
  write(rl, stdout, { format: Format.YAML });
}

main();
