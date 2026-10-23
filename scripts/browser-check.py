"""Browser smoke test of the bundled calculator with the unit-system toggle.

Optional dependency: pip install playwright; browser executable may vary by OS.
Uses set_content because external navigation can be blocked in isolated sandboxes.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import math
import os

root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser_kwargs={'headless': True}
    if os.path.exists('/usr/bin/chromium'):
        browser_kwargs.update(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    browser=p.chromium.launch(**browser_kwargs)
    page=browser.new_page(viewport={'width':1280,'height':900},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda exc: errors.append(str(exc)))
    html=(root/'index.html').read_text().replace('<script defer src="./dist/app.js"></script>','')
    page.set_content(html)
    page.add_style_tag(content=(root/'css/styles.css').read_text())
    page.add_script_tag(content=(root/'dist/app.js').read_text())

    assert page.locator('#pipe-material option').count()==5
    assert page.locator('#pipe-size option').count()==15
    assert page.locator('#capacity').inner_text()=='0.5298'
    assert page.locator('#drainage-rows tr').count()==6
    assert page.locator('#pipe-comparison-rows tr').count()==7
    assert page.locator('table caption').count()==2
    assert page.get_by_role('group',name='Measurement units').count()==1
    assert page.get_by_role('combobox',name='Pipe Size (inches)',exact=True).count()==1
    assert page.get_by_role('spinbutton',name='Drainage area (acres)',exact=True).count()==1

    # The skip link is the first Tab stop and remains keyboard operable.
    page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.className')=='skip-link'
    page.keyboard.press('Enter')
    assert page.evaluate('document.activeElement.id')=='calculator-main'
    page.keyboard.press('Tab')
    assert page.evaluate('document.activeElement.getAttribute("name")')=='units'
    # Radio can be switched with arrow keys, using native keyboard semantics.
    page.keyboard.press('ArrowRight')
    assert page.get_by_role('radio',name='Metric (SI)').is_checked()
    assert page.locator('#capacity-unit').inner_text()=='L/s'
    assert page.locator('#capacity').inner_text()=='15.0023'
    assert page.locator('#velocity-unit').inner_text()=='m/s'
    assert page.locator('#pipe-size option:checked').inner_text()=='25.4'
    assert page.locator('#drainage-rows tr').count()==12
    assert page.locator('#drainage-area').input_value()=='9.267503'
    assert page.get_by_role('combobox',name='Pipe Size (centimeters)',exact=True).count()==1
    assert page.get_by_role('spinbutton',name='Drainage area (hectares)',exact=True).count()==1
    assert 'centimeters' in page.locator('#comparison-table-caption').inner_text()
    assert 'cm/day' in page.locator('#drainage-col-coeff').inner_text()

    # Switching units alone never changes the chosen physical design.
    page.get_by_role('radio',name='Imperial (US)').check()
    assert page.locator('#drainage-area').input_value()=='22.9'
    assert page.locator('#capacity').inner_text()=='0.5298'
    assert page.locator('#pipe-size').input_value()=='10'
    assert page.locator('#drainage-rows tr').count()==6
    page.get_by_role('radio',name='Metric (SI)').check()
    assert page.locator('#capacity').inner_text()=='15.0023'

    # Editing hectares correctly updates the one underlying area in acres.
    page.locator('#drainage-area').fill('20')
    page.get_by_role('radio',name='Imperial (US)').check()
    assert math.isclose(float(page.locator('#drainage-area').input_value()),49.42,rel_tol=1e-10)
    page.get_by_role('radio',name='Metric (SI)').check()
    assert page.locator('#drainage-area').input_value()=='20'

    page.locator('#pipe-material').select_option(label='PVC')
    page.locator('#pipe-size').select_option('12')
    page.locator('#slope').fill('0.25')
    assert 'PVC' in page.locator('#comparison-table-caption').inner_text()
    assert page.locator('#capacity').inner_text()!='15.0023'
    page.locator('#slope').fill('-1')
    assert page.locator('#validation-error').is_visible()
    assert page.locator('#slope').get_attribute('aria-invalid')=='true'
    assert page.locator('#slope').get_attribute('aria-describedby')=='slope-error'
    assert page.evaluate('document.activeElement.id')=='slope'
    page.locator('#slope').fill('0.1')
    assert not page.locator('#validation-error').is_visible()
    page.locator('#drainage-area').fill('')
    assert page.locator('#drainage-area').get_attribute('aria-describedby')=='drainage-area-error'
    page.locator('#drainage-area').fill('20')
    page.locator('#drainage-area').blur()
    assert 'Metric units' in page.locator('#calculation-status').inner_text()

    for width in (320,375,390,430,768,1280):
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth')<=width,f'horizontal overflow at {width}'
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(root/'unit-toggle-mobile-preview.png'),full_page=True)
    page.get_by_role('radio',name='Imperial (US)').check()
    page.set_viewport_size({'width':1280,'height':900})
    page.screenshot(path=str(root/'unit-toggle-desktop-preview.png'),full_page=True)
    assert not errors,f'JavaScript errors: {errors}'
    print('PASS: unit toggle, conversions, keyboard, validation, responsive layout and original calculations')
    browser.close()
