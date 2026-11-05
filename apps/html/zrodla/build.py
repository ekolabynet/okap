# SPDX-License-Identifier: MPL-2.0
# This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
# © 2026 Piotr Mędrzycki, Paweł Mędrzycki
"""Buduje jednoplikową aplikację HTML Okap Teren z silnika odniesienia i źródeł interfejsu."""
import pathlib
d = pathlib.Path(__file__).resolve().parent
root = d.parents[2]
eng = ''.join((root / 'reference' / 'js' / f).read_text(encoding='utf-8') for f in ['e0_utils.js','e1_lib.js','e2_params.js','e3_terrain.js','e4_env.js','e5_sim.js','e6_run.js'])
ui = ''.join((d / f).read_text(encoding='utf-8') for f in ['u1_core.js','u2_view.js','u3_section.js','u4_data.js','u5_exp.js','u7_vox.js','u6_panels.js'])
assert '</script' not in eng and '</script' not in ui
out = (d / 'shell.html').read_text(encoding='utf-8').replace('/*ENGINE*/', eng).replace('/*UI*/', ui)
(d.parent / 'okap_teren.html').write_text(out, encoding='utf-8')
print('zbudowano', d.parent / 'okap_teren.html', len(out), 'znaków')
