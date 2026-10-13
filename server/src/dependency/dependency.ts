import { Repository } from "@workspace/server/repository";
import { Service } from "@workspace/server/service";
import { prisma } from "@workspace/db/client"
import { Cache } from "@workspace/server/cache";

export const cache = new Cache()

const repository = new Repository(prisma);

export const service = new Service(repository, cache);


