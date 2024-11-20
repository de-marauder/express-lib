import type { Model, FindAndCountOptions, WhereOptions, ModelStatic, CreationAttributes, CreateOptions, Attributes, FindOptions, Identifier, CountOptions } from 'sequelize';

export type PaginationQuery = {
  page: number;
  limit: number;
}
export interface PaginationOptions<T extends Model> {
  pageNumber: number;
  pageSize: number;
  where?: WhereOptions<T>;
}

export abstract class DatabaseService<M extends Model> {

  readonly model: ModelStatic<M>;

  constructor(model: ModelStatic<M>) {
    this.model = model;
  }

  async create<
    M extends Model,
    O extends CreateOptions<Attributes<M>> = CreateOptions<Attributes<M>>
  >(values?: CreationAttributes<M>, options?: O) {
    return this.model.create(values, options);
  }

  async findOne(options?: FindOptions<Attributes<M>>) {
    return this.model.findOne(options);
  }
  async findByPk(
    identifier?: Identifier,
    options?: Omit<FindOptions<Attributes<M>>, 'where'>
  ) {
    return this.model.findByPk(identifier, options);
  };

  async findAll(options?: FindOptions<Attributes<M>>) {
    return this.model.findAll(options);
  }

  async count(options?: Omit<CountOptions<Attributes<M>>, "group"> | undefined): Promise<number> {
    return await this.model.count(options);
  }

  async paginate({ pageNumber, pageSize, where }: PaginationOptions<M>) {
    const [page, limit] = [+pageNumber || 1, +pageSize || 10];
    const options: FindAndCountOptions = {
      limit: +limit,
      offset: (+page - 1) * +limit,
      order: [['createdAt', 'DESC']],
      where,
    };

    const [foundItems, count] = await Promise.all([
      this.model.findAll(options),
      this.model.count({ where: options.where })
    ]);
    const totalPages = Math.ceil(count / limit);
    const nextPage = +page + 1 > totalPages ? null : +page + 1;

    return {
      count,
      size: +limit,
      totalPages,
      nextPage,
      currentPage: +page,
      foundItems,
    }

  }
}