import { DocumentAnalysisModel } from '../models/document-analysis.model.js';
import type { DocumentAnalysisQuery, CreateDocumentAnalysisInput, UpdateDocumentAnalysisInput, ValidateDocumentAnalysisInput } from '../validators/document-analysis.schemas.js';
import type { ClientSession, FilterQuery } from 'mongoose';

type SessionOption = ClientSession | null;

const sessionOpt = (session?: ClientSession): { session?: ClientSession } | {} => (session ? { session } : {});

export const createDocumentAnalysis = (organizationId: string, input: CreateDocumentAnalysisInput, session?: ClientSession) =>
  DocumentAnalysisModel.create([{ ...input, organizationId }], sessionOpt(session)).then((d) => d[0]);

export const findDocumentAnalysis = (organizationId: string, id: string, session?: ClientSession) =>
  DocumentAnalysisModel.findOne({ _id: id, organizationId }).session(session ?? null).exec();

export const findDocumentAnalysisByCode = (organizationId: string, code: string, session?: ClientSession) =>
  DocumentAnalysisModel.findOne({ organizationId, code }).session(session ?? null).exec();

export const listDocumentAnalyses = async (organizationId: string, query: DocumentAnalysisQuery) => {
  const filter: FilterQuery<typeof DocumentAnalysisModel> = { organizationId };
  if (query.type) filter.type = query.type;
  if (query.provider) filter.provider = query.provider;
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    DocumentAnalysisModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).exec(),
    DocumentAnalysisModel.countDocuments(filter).exec(),
  ]);
  return { items, total };
};

export const updateDocumentAnalysis = (organizationId: string, id: string, input: UpdateDocumentAnalysisInput, session?: ClientSession) =>
  DocumentAnalysisModel.findOneAndUpdate({ _id: id, organizationId }, { $set: input }, { new: true, runValidators: true, session: session ?? null }).exec()

export const deleteDocumentAnalysis = (organizationId: string, id: string, session?: ClientSession) =>
  DocumentAnalysisModel.findOneAndDelete({ _id: id, organizationId }).session(session ?? null).exec();

export const updateResults = (organizationId: string, id: string, results: unknown, session?: ClientSession) =>
  DocumentAnalysisModel.findOneAndUpdate({ _id: id, organizationId }, { $set: { results, status: 'COMPLETED' } }, { new: true, session: session ?? null }).exec();

export const validateAnalysis = (organizationId: string, id: string, input: ValidateDocumentAnalysisInput, session?: ClientSession) =>
  DocumentAnalysisModel.findOneAndUpdate(
    { _id: id, organizationId },
    { $set: { 'validation.isValidated': true, 'validation.validatedBy': input.validatedBy, 'validation.validatedAt': new Date(), 'validation.corrections': input.corrections } },
    { new: true, session: session ?? null },
  ).exec();




