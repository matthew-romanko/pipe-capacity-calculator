"""Browser smoke test of the actual generated classic-script bundle."""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1280,'height':900}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda exc: errors.append(str(exc)))
    # Navigation is administratively disabled in some sandboxes, so inject the
    # unmodified built script into HTML (not rewritten ES modules).
    html = (root/'index.html').read_text().replace('<script defer src="./dist/app.js"></script>', '')
    page.set_content(html)
    page.add_style_tag(content=(root/'css/styles.css').read_text())
    page.add_script_tag(content=(root/'dist/app.js').read_text())
    page.locator('#pipe-material option').first.wait_for(state='attached')
    # The skip link must be first in the tab order and put focus on <main>.
    page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.className') == 'skip-link'
    page.keyboard.press('Enter')
    assert page.evaluate('document.activeElement.id') == 'calculator-main'
    page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.id') == 'project'
    page.evaluate('window.scrollTo(0,0)')
    assert page.locator('#pipe-material option').count() == 5, 'material dropdown not populated'
    assert page.locator('#pipe-size option').count() == 15, 'size dropdown not populated'
    assert page.locator('#pipe-material').input_value() == 'Single wall CPT'
    assert page.locator('#pipe-size').input_value() == '10'
    assert page.locator('#capacity').inner_text() == '0.5298'
    assert page.locator('#drainage-us-rows tr').count() == 6
    assert page.locator('#metric-rows tr').count() == 12
    assert page.locator('#pipe-comparison-rows tr').count() == 7
    assert page.locator('table caption').count() == 4
    assert page.locator('#pipe-comparison-rows th[scope="row"]').count() == 14
    assert 'inches' in page.locator('label:has(#pipe-size)').inner_text().lower()
    assert 'percent' in page.locator('label:has(#slope)').inner_text().lower()
    assert page.get_by_role('combobox', name='Pipe Size (inches)', exact=True).count() == 1
    for accessible_name in ('Slope (percent)', 'Drainage area (acres)', 'Drainage area (hectares)'):
        assert page.get_by_role('spinbutton', name=accessible_name, exact=True).count() == 1
    page.screenshot(path=str(root/'desktop-preview.png'), full_page=True)
    page.locator('#pipe-material').select_option(label='PVC')
    page.locator('#pipe-size').select_option('12')
    page.locator('#slope').fill('0.25')
    assert page.locator('#capacity').inner_text() != '0.5298'
    assert 'PVC' in page.locator('#us-comparison-table-caption').inner_text()
    page.locator('#area-acres').fill('50')
    assert page.locator('#drainage-us-rows tr').nth(0).locator('td').nth(1).inner_text() == '0.7878'
    page.locator('#slope').fill('-1')
    assert page.locator('#validation-error').is_visible()
    assert page.locator('#slope').get_attribute('aria-invalid') == 'true'
    assert page.locator('#slope').get_attribute('aria-describedby') == 'slope-error'
    assert page.locator('#slope-error').is_visible()
    # No automatic focus or scrolling away from the field when an error appears.
    assert page.evaluate('document.activeElement.id') == 'slope'
    page.locator('#slope').fill('0.1')
    assert not page.locator('#validation-error').is_visible()
    assert page.locator('#slope').get_attribute('aria-invalid') is None
    assert page.locator('#slope-error').is_hidden()
    page.locator('#area-hectares').fill('')
    assert page.locator('#area-hectares').get_attribute('aria-describedby') == 'area-hectares-error'
    page.locator('#area-hectares').fill('20')
    page.locator('#area-hectares').blur()
    assert 'Pipe capacity' in page.locator('#calculation-status').inner_text()
    assert not page.locator('#validation-error').is_visible()
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(root/'mobile-preview.png'), full_page=True)
    assert page.evaluate('document.documentElement.scrollWidth') <= 390
    page.set_viewport_size({'width':320,'height':700})
    assert page.evaluate('document.documentElement.scrollWidth') <= 320
    assert not errors, f'JavaScript errors: {errors}'
    print('PASS browser checks: dropdowns, calculation outputs, keyboard skip, accessible tables, errors, status and 320px reflow')
    browser.close()
