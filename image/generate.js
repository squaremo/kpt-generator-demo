import { core, apps } from '@jkcfg/kubernetes/api';
import { log, read, write, stdin, stdout, Format } from '@jkcfg/std';

class ResourceList {
  constructor(items) {
    this.items = items;
    this.kind = 'ResourceList';
    this.apiVersion = 'config.kubernetes.io/v1beta1';
  }
}

async function main() {
  const input = await read(stdin, { format: Format.YAML });

  const items = [
    new apps.v1.Deployment('deploy', {
    }),
    new core.v1.Service('srv', {
    }),
  ];
  const rl = new ResourceList([...items, ...(input) ? input.items : []]);
  log(rl);
  write(rl, stdout, { format: Format.YAML });
}

main();
