import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'plugins/themes/jjamppong/customCSS.css'), 'utf8')

describe('jjamppong theme header controls', () => {
    test('limits circular icon button styling to the button group', () => {
        expect(css).not.toMatch(/\.header-pill button/)
        expect(css).not.toMatch(/\.scroll-right button/)
        expect(css).toMatch(/\.button-group button\s*\{/)
    })

    test('keeps info pill buttons wide enough to show model text', () => {
        expect(css).toMatch(/\.info-pill button\s*\{/)
        expect(css).toMatch(/width:\s*auto\s*!important/)
        expect(css).toMatch(/font-size:\s*inherit\s*!important/)
        expect(css).toMatch(/overflow:\s*visible\s*!important/)
    })
})
