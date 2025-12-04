import api from './client'
import type { Learner } from '../types/learner'
import type { PageResponse } from '../types/pagination'

export type LearnerCreatePayload = {
  firstName: string
  lastName: string
  email: string
  studentNumber?: string
  nationalId?: string
  dateOfBirth?: string
  institutionId?: number | null
}

export const getLearners = async (params?: {
  institutionId?: number
  page?: number
  size?: number
}): Promise<PageResponse<Learner>> => {
  const page = params?.page ?? 0
  const size = params?.size ?? 20
  const institutionId = params?.institutionId

  const { data } = await api.get<PageResponse<Learner>>('/learners', {
    params: { page, size, institutionId }
  })

  if (!data) {
    return {
      content: [],
      pageNumber: page,
      pageSize: size,
      totalElements: 0,
      totalPages: 0,
      last: true
    }
  }

  if (!Array.isArray(data.content)) {
    return {
      content: [],
      pageNumber: page,
      pageSize: size,
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      last: data.last ?? true
    }
  }

  return data
}

export const getLearnersForInstitution = async (
  institutionId: number,
  size = 100
): Promise<Learner[]> => {
  const page = await getLearners({ institutionId, page: 0, size })
  return page.content ?? []
}

export const createLearner = async (
  payload: LearnerCreatePayload
): Promise<Learner> => {
  const body = {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
    studentNumber: payload.studentNumber?.trim() || undefined,
    nationalId: payload.nationalId?.trim() || undefined,
    dateOfBirth: payload.dateOfBirth || undefined,
    institutionId: payload.institutionId ?? undefined
  }

  const { data } = await api.post<Learner>('/learners', body)
  return data
}

export const updateLearner = async (
  id: number,
  payload: LearnerCreatePayload
): Promise<Learner> => {
  const body = {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
    studentNumber: payload.studentNumber?.trim() || undefined,
    nationalId: payload.nationalId?.trim() || undefined,
    dateOfBirth: payload.dateOfBirth || undefined,
    institutionId: payload.institutionId ?? undefined
  }

  const { data } = await api.put<Learner>(`/learners/${id}`, body)
  return data
}

export const deleteLearner = async (id: number): Promise<void> => {
  await api.delete(`/learners/${id}`)
}

export const getCurrentLearner = async (): Promise<Learner> => {
  const { data } = await api.get<Learner>('/learners/me')
  return data
}
