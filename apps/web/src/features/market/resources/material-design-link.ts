/** 市场物料与设计需求前端关联规则：不改表结构，从备注/标题中识别可空关联。 */
import type { DesignRequirement } from '@/features/design/requirements/types'
import type { EventMaterial } from './types'

const token = (id: string) => `design:${id}`

export function materialLinksRequirement(
  material: Pick<EventMaterial, 'name' | 'notes'>,
  requirement: Pick<DesignRequirement, 'id' | 'title'>
) {
  const haystack = `${material.name}\n${material.notes}`.toLowerCase()
  return (
    haystack.includes(token(requirement.id).toLowerCase()) ||
    Boolean(
      requirement.title && haystack.includes(requirement.title.toLowerCase())
    )
  )
}

export function findRequirementForMaterial<
  T extends Pick<DesignRequirement, 'id' | 'title' | 'status' | 'dueDate'>,
>(
  material: Pick<EventMaterial, 'name' | 'notes'>,
  requirements: ReadonlyArray<T>
): T | undefined {
  return requirements.find((requirement) =>
    materialLinksRequirement(material, requirement)
  )
}

export function findMaterialsForRequirement(
  requirement: Pick<DesignRequirement, 'id' | 'title'>,
  materials: Array<
    Pick<EventMaterial, 'id' | 'name' | 'notes' | 'eventName' | 'status'>
  >
) {
  return materials.filter((material) =>
    materialLinksRequirement(material, requirement)
  )
}
