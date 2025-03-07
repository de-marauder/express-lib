import { v4 as uuidv4 } from 'uuid';
import type {
  ClientSession,
  FilterQuery,
  Model,
  PipelineStage,
  PopulateOptions,
  SortOrder,
  UpdateQuery,
  Document,
  Types,
  DeleteResult,
} from 'mongoose';
import type { PaginationDto, PaginationResponseDto } from './types';
import { DateTime } from 'luxon';
import { APIError, LogLevel, LogTrail } from '../utils';

export class MongooseService<C> {
  private readonly _logger = new LogTrail(
    this.model.name + ' ' + MongooseService.name,
  );

  constructor(readonly model: Model<C>) { }

  async save(doc: Document<{ _id: Types.ObjectId }, any, C>) {
    return doc.save();
  }

  create(data: Partial<C>) {
    return this.model.create(data);
  }

  createWithSession(data: Partial<C>[], session: ClientSession) {
    return this.model.create(data, { session });
  }

  abortSessionIfActive(session: ClientSession) {
    if (session.transaction.isActive) return session.abortTransaction();
  }
  /** always round up to the nearest 10 if not specified */
  roundUpValue(value: number, nearest = 10) {
    return Math.round(value * nearest) / nearest;
  }
  generateUUID() {
    return uuidv4();
  }
  convertDateToUTC(d: Date) {
    const date = new Date(d);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }
  convertDateTimeToUTC(d: Date) {
    const date = new Date(d);
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds(),
      ),
    );
  }
  async paginatedResult(
    query: Partial<PaginationDto>,
    filter: FilterQuery<C>,
    sort?: string | { [key: string]: SortOrder },
    population?: Array<PopulateOptions> | any,
  ): Promise<PaginationResponseDto<C>> {
    const { limit = 10, page = 1 } = query;
    const [foundItems, count] = await Promise.all([
      this.model
        .find(filter)
        .skip((page - 1) * limit)
        .sort(sort ?? { createdAt: -1 })
        .limit(limit + 2)
        .populate(population ? population : []),
      this.model.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(count / limit);

    const nextPage =
      count > limit ? (page < totalPages ? page + 1 : null) : null;
    return {
      limit,
      nextPage,
      currentPage: page,
      totalNumberOfItems: count,
      foundItems,
    };
  }

  dateFormatter(date: Date) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      weekday: 'short',
      year: 'numeric',
    });
  }

  dateDifferenceInDays(date1: Date, date2: Date) {
    const diff = date2.getTime() - date1.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }
  convertTimeToDays(newDate: Date): number {
    // Create a new Date object
    const date = new Date(newDate);
    // Calculate time difference in milliseconds
    const timeDifference = date.getTime() - new Date().getTime();

    // Convert time difference to days
    const days = Math.round(timeDifference / (24 * 60 * 60 * 1000));
    return days;
  }

  dateDifferenceInHours(date1: Date, date2: Date) {
    const diff = date2.getTime() - date1.getTime();
    return Math.round(diff / (1000 * 3600)).toFixed(2) as unknown as number;
  }

  async getSession(): Promise<ClientSession> {
    return this.model.startSession();
  }

  async findByIdAndUpdateWithSession(
    id: string,
    data: UpdateQuery<C>,
    session: ClientSession,
  ) {
    try {
      const result = await this.model.findByIdAndUpdate(id, data, {
        new: true,
        session,
      });
      return result;
    } catch (e) {
      throw new APIError((e as Error).message, 400);

    }
  }

  async distinct(filter: FilterQuery<C>, field: keyof C) {
    return await this.model.distinct(field as unknown as string, filter);
  }

  async countDocuments(filter?: FilterQuery<C>) {
    return this.model.countDocuments(filter);
  }
  async insertManyWithSession(model: C[], session: ClientSession) {
    return await this.model.insertMany(model, {
      session,
    });
  }
  async insertMany(model: C[]) {
    return await this.model.insertMany(model, {});
  }
  async findOneAndUpdateOrErrorOut(
    filter: FilterQuery<C>,
    data: UpdateQuery<C>,
    population?: Array<PopulateOptions>,
  ) {
    try {
      const result = await this.model
        .findOneAndUpdate(filter, data, {
          new: true,
        })
        .populate(population ? population : []);
      if (!result)
        throw new APIError(`${this.model.modelName} not found`, 400);

      return result;
    } catch (e) {
      throw new APIError((e as Error).message, 400);
    }
  }
  async findByIdAndUpdateOrErrorOut(
    id: string,
    data: UpdateQuery<C>,
    population?: Array<PopulateOptions>,
  ) {
    try {
      const result = await this.model
        .findByIdAndUpdate(id, data, {
          new: true,
        })
        .populate(population ? population : []);
      if (!result)
        throw new APIError(`${this.model.modelName} not found`, 400);
      return result;
    } catch (e) {
      throw new APIError((e as Error).message, 400);
    }
  }

  async findOneAndUpdateWithSession(
    filter: FilterQuery<C>,
    data: UpdateQuery<C>,
    session: ClientSession,
  ) {
    try {
      const result = await this.model.findOneAndUpdate(filter, data, {
        new: true,
        session,
      });
      return result;
    } catch (e) {
      throw new APIError((e as Error).message, 400);
    }
  }
  async updateManyWithSession(
    filter: FilterQuery<C>,
    data: UpdateQuery<C>,
    session: ClientSession,
  ) {
    try {
      const result = await this.model.updateMany(filter, data, {
        session,
        new: true,
      });
      return result;
    } catch (e) {
      throw new APIError((e as Error).message, 400);
    }
  }

  async updateWithSession(
    filter: FilterQuery<C>,
    data: UpdateQuery<C>,
    session: ClientSession,
  ) {
    try {
      const result = await this.model.findOneAndUpdate(filter, data, {
        session,
      });
      return result;
    } catch (e) {
      throw new APIError((e as Error).message, 400);
    }
  }

  deleteById(id: string) {
    return this.model.findByIdAndDelete(id);
  }
  async deleteByIdOrErrorOut(id: string) {
    const deletedRecord = await this.model.findByIdAndDelete(id);
    if (deletedRecord) return deletedRecord;
    throw new APIError(
      `${this.model.modelName} record with id ${id} not found`,
      404);
  }
  async deleteManyWithSession(filter: FilterQuery<C>, session: ClientSession): Promise<DeleteResult> {
    const deletedDataInfo = await this.model.deleteMany(filter, { session });
    if (!deletedDataInfo)
      throw new APIError(
        `error deleting ${this.model.modelName} records`,
        404);
    return deletedDataInfo;
  }

  async deleteOneWithSession(filter: FilterQuery<C>, session: ClientSession): Promise<DeleteResult> {
    return this.model.deleteOne(filter, { session });
  }

  async deleteMany(filter: FilterQuery<C>): Promise<DeleteResult> {
    const deletedDataInfo = await this.model.deleteMany(filter);
    if (!deletedDataInfo)
      throw new APIError(
        `error deleting ${this.model.modelName} records`,
        404);
    return deletedDataInfo;
  }
  async findById(id: string, population?: Array<PopulateOptions>) {
    return this.model.findById(id).populate(population ? population : []);
  }

  async findOneSelectAndPopulateOrErrorOut(
    filter: FilterQuery<C>,
    select?: string | string[],
    populate?: Array<PopulateOptions>,
  ) {
    try {
      const data = await this.model
        .findOne(filter)
        .select(select ? select : '')
        .populate(populate ? populate : [])
        .catch((error) => {
          this._logger.error(error);
        });
      if (!data)
        throw new APIError(`error finding ${this.model.modelName}`, 404);
      return data;
    } catch (error) {
      throw new APIError(`error finding ${this.model.modelName}`, 500);
    }
  }

  async findByIdOrErrorOut(id: string, population?: Array<PopulateOptions>) {
    const found = await this.model
      .findById(id)
      .populate(population ? population : []);
    if (!found)
      throw new APIError(`${this.model.modelName} not found`, 404);
    return found;
  }
  async findByIdAndUpdate(
    id: string,
    data: UpdateQuery<C>,
    population?: Array<PopulateOptions>,
  ) {
    try {
      const foundRecord = await this.model
        .findByIdAndUpdate(id, data, {
          new: true,
        })
        .populate(population ? population : []);
      return foundRecord;
    } catch (e) {
      this._logger.error(e);
      throw new APIError((e as Error).message, 500);
    }
  }
  async updateOneOrErrorOut(filter: FilterQuery<C>, data: UpdateQuery<C>) {
    const updateResult = await this.model.updateOne(filter, data, {
      new: true,
    });
    if (!updateResult.matchedCount)
      throw new APIError(`${this.model.modelName} not found`, 404);
    return updateResult;
  }
  async updateOne(filter: FilterQuery<C>, data: UpdateQuery<C>) {
    return await this.model.updateOne(filter, data, {
      new: true,
    });
  }
  async updateMany(
    filter: FilterQuery<C>,
    data: UpdateQuery<C>,
    population?: Array<PopulateOptions>,
  ) {
    try {
      const foundRecord = await this.model
        .updateMany(filter, data, {
          new: true,
        })
        .populate(population ? population : []);
      return foundRecord;
    } catch (e) {
      throw new APIError((e as Error).message, 500);
    }
  }

  async updateManyOrErrorOut(
    filter: FilterQuery<C>,
    data: UpdateQuery<C>,
    population?: PopulateOptions,
  ) {
    try {
      const response = await this.model
        .updateMany(filter, data, {
          new: true,
        })
        .populate(population ? population : []);
      if (!response)
        throw new APIError(`error updating ${this.model.modelName} `, 400);
      return response;
    } catch (e) {
      throw new APIError((e as Error).message, 500);
    }
  }
  async updateByIdErrorOut(
    id: string,
    data: UpdateQuery<C>,
    population?: Array<PopulateOptions> | any,
  ) {
    try {
      const foundRecord = await this.model
        .findByIdAndUpdate(id, data, {
          new: true,
        })
        .populate(population ? population : []);
      if (!foundRecord)
        throw new APIError(
          `${this.model.modelName}  record not found`,
          404);
      return foundRecord;
    } catch (e) {
      throw new APIError((e as Error).message, 500);
    }
  }
  findOne(data: FilterQuery<C>, populate?: Array<PopulateOptions>) {
    return this.model.findOne(data).populate(populate ? populate : []);
  }
  find(data: FilterQuery<C>, populate?: Array<PopulateOptions>) {
    return this.model.find(data).populate(populate ? populate : []);
  }

  aggregate(aggregationQuery: PipelineStage[]) {
    return this.model.aggregate(aggregationQuery);
  }

  async findOrErrorOut(
    data: FilterQuery<C>,
    populate?: Array<PopulateOptions>,
  ) {
    const results = await this.model
      .find(data)
      .populate(populate ? populate : []);
    if (!results.length)
      throw new APIError(`${this.model.modelName} records not found`, 404);

    return results;
  }
  async findOneOrErrorOut(
    data: FilterQuery<C>,
    populate?: Array<PopulateOptions>,
  ) {
    const foundRecord = await this.findOne(data).populate(
      populate ? populate : [],
    );

    if (!foundRecord)
      throw new APIError(`${this.model.modelName} record not found`, 404);

    return foundRecord;
  }
  async propExists(data: FilterQuery<C>) {
    return this.model.countDocuments(data).then((count) => count > 0);
  }
  // Date of Birth Handler (D, M, Y)
  convertDOB(date: Date) {
    const dateObj = date;
    const month = dateObj.getUTCMonth() + 1;
    const day = dateObj.getUTCDate();
    const year = dateObj.getUTCFullYear();

    return {
      day,
      month,
      year,
    };
  }

  convertDateStringToValidDateObject(dateString: string) {
    const formattedDateString = dateString.replace('PM', '').replace('AM', '');
    const dateObject = new Date(formattedDateString);
    return dateObject;
  }

  getDatesInBetween(startDate: Date, stopDate: Date) {
    const dateArray: Array<Date> = [];
    let currentDate = startDate;
    const addDays = function (currDate: Date, days: number) {
      const date = new Date(currDate.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };
    while (currentDate <= stopDate) {
      dateArray.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }
    return dateArray;
  }

  getTheNumberOfMonthsBetweenDates(dateOne: Date, dateTwo: Date) {
    dateOne = new Date(dateOne);
    dateTwo = new Date(dateTwo);
    const dateOneDatetime = DateTime.fromJSDate(dateOne).toUTC();
    const dateTwoDatetime = DateTime.fromJSDate(dateTwo).toUTC();
    const { months } = dateTwoDatetime.diff(dateOneDatetime, 'months');
    this._logger.log(`number of months between dates is: ${months}`, LogLevel.DEBUG);
    return months;
  }

  getTheFirstDayOfTheWeekWithinADateRange(startDate: Date, endDate: Date) {
    const aDay = 7 * 24 * 60 * 60 * 1000;
    let firstDay = startDate.getTime();
    const firstDayOfTheWeekArray: Array<string> = [];
    while (firstDay <= endDate.getTime()) {
      firstDayOfTheWeekArray.push(new Date(firstDay).toUTCString());
      firstDay += aDay;
    }
    return firstDayOfTheWeekArray;
  }

  getTheFirstDayOfTheMonthWithinADateRange(startDate: Date, endDate: Date) {
    //Get the first day for the end date for the month
    const newEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    //get the date counter to start from the middle of the month
    const counter = new Date(startDate.getFullYear(), startDate.getMonth(), 15);
    const aMonth = 30 * 24 * 60 * 60 * 1000;
    let startCounter = counter.getTime();
    const firstDayOfTheMonthArray: Array<Date> = [];
    while (startCounter <= newEndDate.getTime()) {
      let firstDayOfTheMonth = new Date(startCounter);
      firstDayOfTheMonth = new Date(
        firstDayOfTheMonth.getFullYear(),
        firstDayOfTheMonth.getMonth(),
        1,
      );

      firstDayOfTheMonthArray.push(firstDayOfTheMonth);
      startCounter += aMonth;
    }
    return firstDayOfTheMonthArray;
  }

  getDateFromWeekNumber(week: number) {
    const year = new Date().getFullYear();
    const day = 1 + (week - 1) * 7; // 1st of January + 7 days for each week
    return new Date(year, 0, day);
  }

  calculateTheStartDate(currentDate: Date) {
    let startDate = new Date(currentDate.getTime() - 35 * 24 * 60 * 60 * 1000);
    startDate = this.getTheStartDateForTheWeek(startDate);
    return startDate;
  }

  getTheStartDate(currentDate: Date) {
    //add a week to the current date and ge the start date for that week
    let startDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    startDate = this.getTheStartDateForTheWeek(startDate);
    return startDate;
  }

  getTheStartDateForTheWeek(currentDate: Date) {
    const firstDay = currentDate.getDate() - currentDate.getDay(); // First day is the day of the month - the day of the week
    const firstDayOfTheWeek = new Date(currentDate.setDate(firstDay));
    return firstDayOfTheWeek;
  }

  getTheFirstDayOfTheMonthWithValueWithinADateRange(
    startDate: Date,
    endDate: Date,
  ) {
    const startDateFullYear = new Date(startDate).getFullYear();
    const startDateMonth = new Date(startDate).getMonth() + 1;
    const startDateString = `${startDateFullYear}-${startDateMonth}-01`;

    const endDateFullYear = new Date(endDate).getFullYear();
    const endDatePreviousMonth = new Date(endDate).getMonth();
    const endDateString = `${endDateFullYear}-${endDatePreviousMonth}-01`;
    const dates = this.dateRange(startDateString, endDateString);
    return dates;
  }

  dateRange(startDate: string, endDate: string) {
    const start = startDate.split('-');
    const end = endDate.split('-');
    const startYear = parseInt(start[0]!);
    const endYear = parseInt(end[0]!);
    const dates: Array<string> = [];

    for (let i = startYear; i <= endYear; i++) {
      const endMonth = i != endYear ? 11 : parseInt(end[1]!) - 1;
      const startMon = i === startYear ? parseInt(start[1]!) - 1 : 0;
      for (let j = startMon; j <= endMonth; j = j > 12 ? j % 12 || 11 : j + 1) {
        const month = j + 1;
        const displayMonth = month < 10 ? '0' + month : month;
        dates.push([i, displayMonth, '01'].join('-'));
      }
    }
    return dates;
  }

  /** compare equality of two objects */
  compareObjectEquality(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
  ) {
    const objectOfSameLength =
      Object.keys(obj1).length !== Object.keys(obj2).length;
    if (objectOfSameLength) return false;
    else {
      for (const key of Object.keys(obj1)) {
        if (obj1[key] !== obj2[key]) return false;
      }
      return true;
    }
  }

  /** delay execution for certain milliseconds */
  sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  aggregatePagination = async (
    pg: PaginationDto,
    aggregate: PipelineStage[],
    sort?: Record<string, 1 | -1>,
  ) => {
    const [foundItems, [countData]] = await Promise.all([
      this.model.aggregate<C>([
        ...aggregate,
        { $limit: pg.limit },
        { $skip: (pg.page - 1) * pg.limit },
        { $sort: sort ?? { createdAt: -1 } },
      ]),
      this.model.aggregate<{ count: number }>([
        ...aggregate,
        { $count: 'count' },
      ]),
    ]);

    const count = countData?.count ?? 0;
    const totalPages = Math.ceil(count / pg.limit);
    const nextPage = pg.page + 1 > totalPages ? null : pg.page + 1;
    return {
      count,
      size: pg.limit,
      totalPages,
      nextPage,
      currentPage: pg.page,
      foundItems,
    };
  };

  // async findOneOrCreate(filter: FilterQuery<C>) {
  //   const data = await this.model.findOne(filter);
  //   if (data) return data;
  //   return new this.model(filter);
  // }
}
