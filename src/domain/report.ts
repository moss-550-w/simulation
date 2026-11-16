import { STATUS_META } from './calculation';
import { getKeyTypeName } from './keyTypes';
import { formatNumber, newtonMillimeterToNewtonMeter } from './normalize';
import type { ConnectionResult, NormalizedInputs } from './types';

export interface PrintableReportOptions {
  inputs: NormalizedInputs;
  result: ConnectionResult;
  imageDataUrl: string;
  generatedAt: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function row(label: string, value: string): string {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

export function buildPrintableReport({ inputs, result, imageDataUrl, generatedAt }: PrintableReportOptions): string {
  const sourceLabels = { sigmaPAxle: '轴', sigmaPHub: '轮毂', sigmaPKey: '键' };
  const sources = result.sigmaPAllowSources.map((source) => sourceLabels[source]).join('、');
  const torqueNm = newtonMillimeterToNewtonMeter(inputs.T);
  const torquePerKeyNm = newtonMillimeterToNewtonMeter(result.torquePerKey);
  const lengthFormula = inputs.type === 'A' ? 'L − b' : inputs.type === 'C' ? 'L − b/2' : 'L';
  const loadSymbol = result.keyCount === 2 ? 'Ti' : 'T';
  const doubleAssumption = result.keyCount === 2
    ? `<section><h2>双键载荷分配假设</h2><p>双键沿圆周呈 180° 布置，每键按 Ti = T/φ 承载。φ = ${formatNumber(result.loadFactor)}，表示双键合计承载能力按单键的 φ 倍估计；φ = 2 为理想均载。以下结果为每个键的平均应力，不是精确载荷分布。</p><div class="formula">Ti = T/φ = ${formatNumber(inputs.T)} / ${formatNumber(result.loadFactor)} = ${formatNumber(result.torquePerKey)} N·mm = ${formatNumber(torquePerKeyNm)} N·m</div></section>`
    : '';
  const shearRows = result.tau === undefined ? '' : [
    row('剪切应力 τ', `${formatNumber(result.tau)} MPa`),
    row('剪切利用率 ητ', formatNumber(result.etaTau)),
    row('剪切安全系数 Sτ', formatNumber(result.STau)),
  ].join('');
  const shearFormula = result.tau === undefined ? '' : `<div class="formula">τ = 2${loadSymbol}/(d·b·l) = 2 × ${formatNumber(result.torquePerKey)} / (${formatNumber(inputs.d)} × ${formatNumber(inputs.b)} × ${formatNumber(result.l)}) = ${formatNumber(result.tau)} MPa</div>`;

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>普通平键连接强度校核报告</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#edf1f5;color:#17283b;font-family:"Microsoft YaHei","PingFang SC",Arial,sans-serif;line-height:1.6}main{max-width:960px;margin:24px auto;padding:36px 42px;background:#fff;box-shadow:0 3px 18px #20344618}header{padding-bottom:18px;border-bottom:3px solid #197189}h1{margin:0 0 6px;font-size:25px}h2{margin:0 0 12px;padding-left:9px;border-left:3px solid #197189;font-size:17px}p{margin:7px 0}.meta{color:#68798a;font-size:12px}.status{display:inline-block;margin-top:12px;padding:5px 12px;color:#fff;background:${STATUS_META[result.status].color};font-weight:700}section{margin-top:25px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 10px;border:1px solid #d6dee6;text-align:left}th{width:31%;background:#f3f6f8;font-weight:600}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.formula{margin:9px 0;padding:11px 13px;background:#f5f8fa;border:1px solid #dfe6eb;font:13px/1.7 Consolas,"Microsoft YaHei",monospace;overflow-wrap:anywhere}img{display:block;width:100%;max-height:580px;object-fit:contain;border:1px solid #d6dee6;background:#fff}.note{color:#68798a;font-size:12px}.report-actions{position:fixed;right:22px;top:22px;display:flex;gap:8px}.report-actions button{padding:10px 16px;color:#fff;background:#197189;border:0;border-radius:3px;cursor:pointer}.report-actions .back-button{background:#425e70}footer{margin-top:26px;padding-top:13px;border-top:1px solid #d6dee6;color:#68798a;font-size:11px}@page{size:A4;margin:13mm}@media print{body{background:#fff}main{max-width:none;margin:0;padding:0;box-shadow:none}.report-actions{display:none}section{break-inside:avoid}header{break-after:avoid}img{max-height:125mm}.grid{gap:12px}th,td{padding:6px 8px}}@media(max-width:650px){main{margin:0;padding:22px 16px}.grid{grid-template-columns:1fr}.report-actions{position:static;margin:12px}}
</style>
</head>
<body>
<div class="report-actions"><button class="back-button" type="button" onclick="window.location.reload()">返回校核</button><button type="button" onclick="window.print()">打印 / 另存 PDF</button></div>
<main>
<header>
<h1>普通平键连接强度校核报告</h1>
<p class="meta">生成时间：${escapeHtml(generatedAt)} · 解析解校核 · 长度 mm · 应力 MPa</p>
<span class="status">${STATUS_META[result.status].icon} ${STATUS_META[result.status].label} · ηmax = ${formatNumber(result.etaMax)}</span>
<p>${STATUS_META[result.status].conclusion}</p>
</header>
<section><h2>输入参数</h2><div class="grid"><table><tbody>
${row('键型', getKeyTypeName(inputs.type))}
${row('键布置', result.keyCount === 2 ? '双键 180°' : '单键')}
${row('轴径 d', `${formatNumber(inputs.d)} mm`)}
${row('轮毂外径 D', `${formatNumber(inputs.D)} mm`)}
${row('轮毂长度 Bh', `${formatNumber(inputs.Bh)} mm`)}
${row('键总长 L', `${formatNumber(inputs.L)} mm`)}
${row('键宽 b', `${formatNumber(inputs.b)} mm`)}
${row('键高 h', `${formatNumber(inputs.h)} mm`)}
</tbody></table><table><tbody>
${row('轴槽深 t1', `${formatNumber(inputs.t1)} mm`)}
${row('轮毂槽深 t2', `${formatNumber(inputs.t2)} mm`)}
${row('总传递转矩 T', `${formatNumber(torqueNm)} N·m`)}
${row('轴许用挤压应力', `${formatNumber(inputs.sigmaPAxle)} MPa`)}
${row('轮毂许用挤压应力', `${formatNumber(inputs.sigmaPHub)} MPa`)}
${row('键许用挤压应力', inputs.sigmaPKey === undefined ? '未填写' : `${formatNumber(inputs.sigmaPKey)} MPa`)}
${row('剪切校核', inputs.enableShear ? `开启，[τ] = ${formatNumber(inputs.tauAllow)} MPa` : '关闭')}
${result.keyCount === 2 ? row('载荷分配系数 φ', formatNumber(result.loadFactor)) : ''}
</tbody></table></div></section>
${doubleAssumption}
<section><h2>计算结果</h2><div class="grid"><table><tbody>
${row('工作长度 l', `${formatNumber(result.l)} mm`)}
${row('接触高度 hk', `${formatNumber(result.hk)} mm`)}
${row('挤压应力 σp', `${formatNumber(result.sigmaP)} MPa`)}
${row('许用挤压应力 [σp]', `${formatNumber(result.sigmaPAllow)} MPa（${sources}）`)}
</tbody></table><table><tbody>
${row('挤压利用率 ηp', formatNumber(result.etaP))}
${row('挤压安全系数 Sp', formatNumber(result.Sp))}
${shearRows}
${row('综合利用率 ηmax', formatNumber(result.etaMax))}
</tbody></table></div></section>
<section><h2>公式与数值代入</h2>
<div class="formula">l = ${lengthFormula} = ${formatNumber(result.l)} mm<br>hk = h/2 = ${formatNumber(inputs.h)}/2 = ${formatNumber(result.hk)} mm</div>
<div class="formula">σp = 2${loadSymbol}/(d·hk·l) = 2 × ${formatNumber(result.torquePerKey)} / (${formatNumber(inputs.d)} × ${formatNumber(result.hk)} × ${formatNumber(result.l)}) = ${formatNumber(result.sigmaP)} MPa</div>
${shearFormula}
<div class="formula">ηp = σp/[σp] = ${formatNumber(result.sigmaP)}/${formatNumber(result.sigmaPAllow)} = ${formatNumber(result.etaP)}<br>Sp = ${formatNumber(result.Sp)}</div>
</section>
<section><h2>双视图工程示意</h2><img src="${escapeHtml(imageDataUrl)}" alt="普通平键横截面与纵剖面工程示意"><p class="note">横截面等比例，纵剖面为纵向示意比例。图形用于结构与受力说明，不表示应力分布。</p></section>
<footer>本报告由普通平键连接强度校核系统生成。采用静连接平均应力解析公式，不是有限元分析或精确仿真结果。</footer>
</main>
</body>
</html>`;
}
