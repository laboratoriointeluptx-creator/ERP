import { HttpError } from '../../../shared/http.js';
import { createAttachment, findAttachment, listAttachments, deleteAttachment } from '../repositories/attachment.repository.js';
import type { CreateAttachmentInput, AttachmentQuery } from '../validators/attachment.schemas.js';

export const uploadAttachment = async (organizationId: string, input: CreateAttachmentInput) => {
  try {
    return await createAttachment(organizationId, input);
  } catch (error: unknown) {
    throw error;
  }
};

export const getAttachments = (organizationId: string, query: AttachmentQuery) => listAttachments(organizationId, query);

export const removeAttachment = async (organizationId: string, id: string) => {
  const deleted = await deleteAttachment(organizationId, id);
  if (!deleted) throw new HttpError(404, 'ATTACHMENT_NOT_FOUND', 'Attachment not found');
  return deleted;
};