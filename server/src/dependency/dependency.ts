import { Repository } from "@workspace/server/repository";
import { Service } from "@workspace/server/service";
import { prisma } from "@workspace/db/client"
import { Cache } from "@workspace/server/cache";
import { TypeCheck } from "@workspace/server/parsing";

const tc = new TypeCheck()
export const cache = new Cache()
export const repository = new Repository(prisma);
export const service = new Service(repository, cache, tc);


