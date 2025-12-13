import { AI, InvokeLLM as InvokeLLMFn } from './client';

export const Core = {
  InvokeLLM: InvokeLLMFn,
  SendEmail: async () => { throw new Error('SendEmail not implemented - use backend email service'); },
  SendSMS: async () => { throw new Error('SendSMS not implemented'); },
  UploadFile: async () => { throw new Error('UploadFile not implemented'); },
  GenerateImage: async () => { throw new Error('GenerateImage not implemented'); },
  ExtractDataFromUploadedFile: async () => { throw new Error('ExtractDataFromUploadedFile not implemented'); },
};

export const InvokeLLM = InvokeLLMFn;
export const SendEmail = Core.SendEmail;
export const SendSMS = Core.SendSMS;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
