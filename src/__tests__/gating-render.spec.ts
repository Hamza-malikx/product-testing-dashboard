import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '@/App.vue'
import { useTier } from '@/composables/useTier'
import type { Tier } from '@/config/tiers'

// The charts draw on a canvas, which jsdom does not implement, so they
// are stubbed. Everything this file asserts is gating, not charting.
const stubs = { ScoreChart: true, EfficiencyChart: true }

async function renderAs(tier: Tier) {
  useTier().setTier(tier)
  const wrapper = mount(App, { global: { stubs } })
  await nextTick()
  return wrapper
}

// These tests check what each plan must NOT be able to see. Testing the
// refusals is the same habit that protects a real API: assert what has
// to fail, not only what has to work.
//
// They assert against html(), not text(), on purpose. Product data also
// travels through attributes (the download button's aria-label carries
// the report id), and text() silently ignores attributes, so a text-only
// assertion would pass even if the data were sitting in the markup.
describe('what each plan renders', () => {
  it('basic never receives product data anywhere in its markup', async () => {
    const wrapper = await renderAs('basic')
    const html = wrapper.html()

    expect(html).not.toContain('BrandA')
    expect(html).not.toContain('BrandB')
    expect(html).not.toContain('BrandC')
    expect(html).not.toContain('eval_889')
    expect(html).not.toContain('DW-300')
    // Basic does not reach the table at all, so neither control exists
    expect(wrapper.find('.download-all').exists()).toBe(false)
    expect(wrapper.find('.pdf-btn').exists()).toBe(false)

    // The aggregates it does pay for are still there
    expect(wrapper.text()).toContain('82.4')
  })

  it('basic sees a locked region that is hidden from assistive tech', async () => {
    const wrapper = await renderAs('basic')

    // The gate itself must be doing the work, not just an empty view
    const locked = wrapper.find('.locked-region')
    expect(locked.exists()).toBe(true)
    expect(wrapper.find('.frost').exists()).toBe(true)

    // The decoy underneath must be unreachable by keyboard or screen reader
    const decoy = wrapper.find('.decoy')
    expect(decoy.attributes('aria-hidden')).toBe('true')
    expect(decoy.attributes('inert')).toBeDefined()

    // And the upgrade prompt must offer a way forward
    expect(wrapper.text()).toContain('Model-level results are on Premium')
  })

  it('premium sees the products but cannot download reports', async () => {
    const wrapper = await renderAs('premium')

    expect(wrapper.html()).toContain('BrandC')

    // The report action stays on screen, locked, so the plan difference
    // reads as disabled versus enabled rather than the control vanishing
    const categoryButton = wrapper.find('.download-all')
    expect(categoryButton.exists()).toBe(true)
    expect(categoryButton.classes()).toContain('locked')
    expect(categoryButton.attributes('aria-disabled')).toBe('true')

    // The per-row buttons are visible, locked, and still keyboard reachable
    const locked = wrapper.findAll('.pdf-btn.locked')
    expect(locked.length).toBe(3)
    expect(locked[0]?.attributes('aria-disabled')).toBe('true')
    // aria-disabled, not the disabled attribute, is what keeps them focusable
    expect(locked[0]?.attributes('disabled')).toBeUndefined()

    // The efficiency view stays locked one level up
    expect(wrapper.text()).toContain('The efficiency view is on Enterprise')
  })

  it('enterprise sees everything and gets working downloads', async () => {
    const wrapper = await renderAs('enterprise')

    expect(wrapper.html()).toContain('BrandC')
    const categoryButton = wrapper.find('.download-all')
    expect(categoryButton.exists()).toBe(true)
    expect(categoryButton.classes()).not.toContain('locked')
    expect(wrapper.findAll('.pdf-btn.locked').length).toBe(0)
    expect(wrapper.findAll('.pdf-btn').length).toBe(3)

    // Nothing is locked any more
    expect(wrapper.find('.locked-region').exists()).toBe(false)
  })
})
