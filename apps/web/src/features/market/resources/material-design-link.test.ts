/** 市场物料与设计需求前端关联规则测试。 */
import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  findMaterialsForRequirement,
  findRequirementForMaterial,
  materialLinksRequirement,
} from './material-design-link'

const requirement = {
  id: 'req-1',
  title: '金鳞会主KV',
  status: 'pending',
  dueDate: '2026-08-20',
} as const

const materials = [
  {
    id: 'mat-1',
    name: '厦门沙龙主KV',
    notes: 'design:req-1 需要设计侧同步交付',
    eventName: '厦门沙龙',
    status: 'designing',
  },
  {
    id: 'mat-2',
    name: '金鳞会主KV 海报导出',
    notes: '',
    eventName: '年度峰会',
    status: 'confirmed',
  },
  {
    id: 'mat-3',
    name: '桌牌',
    notes: '普通物料',
    eventName: '年度峰会',
    status: 'printed',
  },
] as const

describe('material design link rules', () => {
  it('matches explicit design id token in notes', () => {
    expect(materialLinksRequirement(materials[0], requirement)).toBe(true)
  })

  it('matches requirement title in material name', () => {
    expect(materialLinksRequirement(materials[1], requirement)).toBe(true)
  })

  it('does not link unrelated materials', () => {
    expect(materialLinksRequirement(materials[2], requirement)).toBe(false)
  })

  it('finds one linked requirement for a material', () => {
    const requirements = [
      {
        id: 'other',
        title: '其他需求',
        status: 'pending',
        dueDate: '',
        description: '待补充',
      },
      { ...requirement, description: '主视觉需求' },
    ] as const
    const result = findRequirementForMaterial(materials[0], requirements)

    expect(result).toMatchObject({ id: 'req-1' })
    expectTypeOf(result).toEqualTypeOf<(typeof requirements)[number] | undefined>()
  })

  it('finds all materials linked to one requirement', () => {
    expect(
      findMaterialsForRequirement(requirement, [...materials]).map(
        (item) => item.id
      )
    ).toEqual(['mat-1', 'mat-2'])
  })
})
