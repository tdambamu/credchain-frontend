import api from './client'
import type { Learner } from '../types/learner'
import type { PageResponse } from '../types/pagination'

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

  if (!data || !Array.isArray(data.content)) {
    return {
      content: [],
      pageNumber: page,
      pageSize: size,
      totalElements: 0,
      totalPages: 0,
      last: true
    }
  }

  return data
}

export const getLearnersForInstitution = async (
  institutionId: number,
  size = 100
): Promise<Learner[]> => {
  const page = await getLearners({ institutionId, page: 0, size })
  return page.content
}
