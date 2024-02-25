const handlebars = require('handlebars');

module.exports = (args) => {
  const { moduleName } = args;
  const headlessModuleName = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
  const hyphenatedModuleName = moduleName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  const moduleTemplate = handlebars.compile(`
import { Module } from '@nestjs/common';
import { {{ moduleName }}Controller } from './presentation/{{ headlessModuleName }}.controller';
import { {{ moduleName }}Service } from './application/{{ headlessModuleName }}.service';
import { {{ moduleName }}Repository } from './infrastructure/{{ headlessModuleName }}.repository';

@Module({
  imports: [],
  controllers: [{{ moduleName }}Controller],
  providers: [{{ moduleName }}Service, {{ moduleName }}Repository],
  exports:[{{ moduleName }}Service]
})
export class {{ moduleName }}Module {}
  `);

  const controllerTemplate = handlebars.compile(`
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { {{ moduleName }}Service } from '../application/{{ headlessModuleName }}.service';
import { {{ moduleName }}Dto } from '../dtos/{{ headlessModuleName }}.dto';
import { Create{{ moduleName }}Dto } from '../dtos/create{{ moduleName }}.dto';

@Controller('{{ hyphenatedModuleName }}')
export class {{ moduleName }}Controller {
  constructor(private readonly {{ headlessModuleName }}Service: {{ moduleName }}Service) { }

  @Get()
  @UseGuards(AuthGuard)
  async getAll(): Promise<{{ moduleName }}Dto[]> {
    return await this.{{ headlessModuleName }}Service.getAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async get{{ moduleName }}(@Param() params: { id: string }): Promise<{{ moduleName }}Dto> {
    return await this.{{ headlessModuleName }}Service.get(params.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async create{{ moduleName }}(@Body() create{{ moduleName }}Dto: Create{{ moduleName }}Dto): Promise<{{ moduleName }}Dto> {
    return await this.{{ headlessModuleName }}Service.create(create{{ moduleName }}Dto);
  }
}
  `);

  const repositoryTemplate = handlebars.compile(`
import { Injectable } from "@nestjs/common";
import * as firebase from 'firebase-admin';
import { {{ moduleName }}Dto } from "../dtos/{{ headlessModuleName }}.dto";

@Injectable()
export class {{ moduleName }}Repository {
  private _collectionRef: FirebaseFirestore.CollectionReference = firebase.firestore().collection('{{ headlessModuleName }}');

  public async get(id: string): Promise<{{ moduleName }}Dto> {
    const result = await this._collectionRef.doc(id).get();
    return new {{ moduleName }}Dto(result);
  }

  public async getAll(): Promise<{{ moduleName }}Dto[]> {
    const resultArray = [];
    const result = await this._collectionRef.get();
    result.docs.forEach(x => { resultArray.push(new {{ moduleName }}Dto(x.data())) })
    return resultArray;
}

  async create({ id, name } : { id: string, name: string }): Promise<any> {
    try {
      const data = { id, name };
      await this._collectionRef.doc(id).set(data);
      return data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }
}
  `);

  const dtoTemplate = handlebars.compile(`
export class {{ moduleName }}Dto {
  id: string;
  name: string;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
  }
}
  `);

  const createDtoTemplate = handlebars.compile(`
export class Create{{ moduleName }}Dto {
  name: string;
}
`);

  const serviceTemplate = handlebars.compile(`
import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { {{ moduleName }}Dto } from '../dtos/{{ headlessModuleName }}.dto';
import { {{ moduleName }}Repository } from '../infrastructure/{{ headlessModuleName }}.repository';
import { Create{{ moduleName }}Dto } from '../dtos/create{{ moduleName }}.dto';

@Injectable()
export class {{ moduleName }}Service {
    constructor(private readonly {{ headlessModuleName }}Repository: {{ moduleName }}Repository) { }

    async create(create{{ moduleName }}Dto: Create{{ moduleName }}Dto): Promise<{{ moduleName }}Dto> {
        try {
            console.log(\`STARTED \${this.constructor.name} create - {create{{ moduleName }}Dto} - \${JSON.stringify({ create{{ moduleName }}Dto })}\`);
            const newDoc = new {{ moduleName }}Dto({
              id: uuid(),
              name: create{{ moduleName }}Dto.name,
            })
            const result = await this.{{ headlessModuleName }}Repository.create({ ...newDoc });

            console.log(\`SUCCESS \${this.constructor.name} create - {result} - \${JSON.stringify({ result })}\`);
            return result;
        } catch (error) {
            console.log(\`ERROR \${this.constructor.name} create: \`);
            console.error(error);
            throw error;
        }
    }

    async get(id: string): Promise<{{ moduleName }}Dto> {
      try {
          console.log(\`STARTED \${this.constructor.name} get - {id} - \${JSON.stringify({ id })}\`)
          const result = await this.{{ headlessModuleName }}Repository.get(id)

          console.log(\`SUCCESS \${this.constructor.name} get - {result} - \${JSON.stringify({ result })}\`)
          return result;
      } catch (error) {
          console.log(\`ERROR \${this.constructor.name} get: \`)
          console.error(error);
          throw error;
      }
    }

    async getAll(): Promise<{{ moduleName }}Dto[]> {
      try {
          console.log(\`STARTED \${this.constructor.name} getAll\`)
          const result = await this.{{ headlessModuleName }}Repository.getAll()

          console.log(\`SUCCESS \${this.constructor.name} getAll - {result} - \${JSON.stringify({ result })}\`)
          return result;
      } catch (error) {
          console.log(\`ERROR \${this.constructor.name} getAll - {error} - \${JSON.stringify({ error })}\`)
      }
    }
}
`);

  return [
    {
      fileName: `${headlessModuleName}/${headlessModuleName}.module.ts`,
      content: moduleTemplate({ moduleName, headlessModuleName }),
    },
    {
      fileName: `${headlessModuleName}/presentation/${headlessModuleName}.controller.ts`,
      content: controllerTemplate({ moduleName, hyphenatedModuleName, headlessModuleName }),
    },
    {
      fileName: `${headlessModuleName}/infrastructure/${headlessModuleName}.repository.ts`,
      content: repositoryTemplate({ moduleName, headlessModuleName }),
    },
    {
      fileName: `${headlessModuleName}/dtos/${headlessModuleName}.dto.ts`,
      content: dtoTemplate({ moduleName, headlessModuleName }),
    },
    {
      fileName: `${headlessModuleName}/dtos/create${moduleName}.dto.ts`,
      content: createDtoTemplate({ moduleName, headlessModuleName }),
    },
    {
      fileName: `${headlessModuleName}/application/${headlessModuleName}.service.ts`,
      content: serviceTemplate({ moduleName, headlessModuleName }),
    },
  ];
};
