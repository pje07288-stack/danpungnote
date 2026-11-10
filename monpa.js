const MONPA_XP={"50":709716,"51":748608,"52":789631,"53":832902,"54":878545,"55":926689,"56":977471,"57":1031036,"58":1087536,"59":1147132,"60":1209994,"61":1276301,"62":1346242,"63":1420016,"64":1497832,"65":1579913,"66":1666492,"67":1757815,"68":1854143,"69":1955750,"70":2062925,"71":2175973,"72":2295216,"73":2420993,"74":2553663,"75":2693603,"76":2841212,"77":2996910,"78":3161140,"79":3334370,"80":3517093,"81":3709829,"82":3913127,"83":4127566,"84":4353756,"85":4592341,"86":4844001,"87":5109452,"88":5389449,"89":5684790,"90":5996316,"91":6324914,"92":6671519,"93":7037118,"94":7422752,"95":7829518,"96":8258575,"97":8711144,"98":9188514,"99":9692044,"100":10223168,"101":10783397,"102":11374327,"103":11997640,"104":12655110,"105":13348610,"106":14080113,"107":14851703,"108":15665576,"109":16524049,"110":17429566,"111":18384706,"112":19392187,"113":20454878,"114":21575805,"115":22758159,"116":24005306,"117":25320796,"118":26708375,"119":28171993,"120":29715818,"121":31344244,"122":33061908,"123":34873700,"124":36784778,"125":38800583,"126":40926854,"127":43169645,"128":45535341,"129":48030677};
'use strict';
// 몬파 이벤트 종료일. 다음 이벤트 일정이 나오면 이 날짜만 바꾸면 돼요.
const MONPA_EVENT_END='2026-11-30';
function koDate(day){let [y,m,d]=day.split('-').map(Number);return `${y}년 ${m}월 ${d}일`}
function parseDay(input){if(!/^\d{4}-\d{2}-\d{2}$/.test(input))return null;let t=Date.parse(input+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===input?t:null}
function simulateMonpa({level,percent,start,end}){
 if(!Number.isInteger(level)||level<50||level>129||!Number.isFinite(percent)||percent<0||percent>=100)throw Error('레벨은 50~129, 경험치는 0% 이상 100% 미만으로 입력해 주세요.');
 let startMs=parseDay(start),endMs=parseDay(end);if(startMs===null||endMs===null||endMs<startMs)throw Error('시작일과 목표일을 올바르게 입력해 주세요.');if(endMs>parseDay(MONPA_EVENT_END))throw Error(`목표 날짜는 이벤트 종료일인 ${koDate(MONPA_EVENT_END)}까지 선택할 수 있어요.`);let dayCount=(endMs-startMs)/86400000+1;if(dayCount>3660)throw Error('계산 기간은 최대 10년까지 입력할 수 있어요.');
 let lv=level,experience=Math.floor(MONPA_XP[level]*percent/100),total=0,runs=0,days=[],counts={까막산:0,자경구:0,용둥:0},stopped=false;
 for(let date=startMs;date<=endMs;date+=86400000){let gains=0,parks=[];for(let i=0;i<2;i++){
  if(lv>=130){stopped=true;break}let park=lv<=70?'까막산':lv<=100?'자경구':'용둥',gain=park==='까막산'?418840:park==='자경구'?2898000:6289000;
  parks.push(park);counts[park]++;runs++;gains+=gain;total+=gain;experience+=gain;
  while(lv<130&&experience>=MONPA_XP[lv]){experience-=MONPA_XP[lv];lv++}
 }
 if(parks.length)days.push({date:new Date(date).toISOString().slice(0,10),parks,gains,level:lv,experience,percent:lv<130?experience/MONPA_XP[lv]*100:null});
 if(stopped)break;
 }
 return {level:lv,experience,percent:lv<130?experience/MONPA_XP[lv]*100:null,total,runs,counts,days,stopped,dayCount};
}
function findMonpaStarts({target,percent,start,end,exact}){let candidates=[];for(let level=50;level<=Math.min(target,129);level++){let r=simulateMonpa({level,percent,start,end});if(exact?r.level===target:r.level>=target)candidates.push({level,result:r})}return candidates}
function findMonpaRanges({target,start,end}){
 if(!Number.isInteger(target)||target<50||target>129)throw Error('목표 레벨은 50~129 사이여야 해요.');
 let ranges=[];
 for(let level=50;level<=target;level++){
  function firstAtLeast(goal){let lo=0,hi=10000;while(lo<hi){let mid=Math.floor((lo+hi)/2);let result=simulateMonpa({level,percent:mid/100,start,end});if(result.level>=goal)hi=mid;else lo=mid+1}return lo}
  let first=firstAtLeast(target);if(first===10000)continue;
  let firstAbove=firstAtLeast(target+1),last=Math.min(9999,firstAbove-1);
  if(first<=last){let result=simulateMonpa({level,percent:first/100,start,end});if(result.level===target)ranges.push({level,minPercent:first/100,maxPercent:last/100,result})}
 }
 return ranges;
}
if(typeof module!=='undefined')module.exports={simulateMonpa,findMonpaStarts,findMonpaRanges};
if(typeof document!=='undefined'){
 const $m=id=>document.getElementById(id), number=x=>Number(x).toLocaleString('ko-KR'),pct=x=>x.toFixed(2)+'%';
 function updateReverse(start,end){let box=$m('monpaReverse');box.replaceChildren();let targets=[100,110,120].filter(x=>$m('goal'+x).checked),custom=$m('goalCustom').value;if(custom!==''){let n=Number(custom);if(Number.isInteger(n)&&n>=50&&n<=129){if(!targets.includes(n))targets.push(n)}else{let warning=document.createElement('p');warning.className='notice';warning.textContent='직접 입력 목표는 50~129 사이의 정수여야 해요.';box.append(warning)}}if(!targets.length)return;for(const target of targets){let found=findMonpaRanges({target,start,end});let card=document.createElement('div');card.className='monpa-reverse-item';let title=document.createElement('strong'),detail=document.createElement('p');title.className='reverse-heading';title.textContent=target+'레벨 주차 · '+start+' 시작';if(found.length){let min=found[0],label=document.createElement('span'),value=document.createElement('strong'),counts=document.createElement('p');label.className='reverse-label';label.textContent='최소 시작';value.className='reverse-min';value.textContent=`${min.level}레벨 ${pct(min.minPercent)}`;detail.textContent=`${end} 종료 시 ${target}레벨 ${pct(min.result.percent)}`;counts.className='reverse-counts';counts.textContent=`까막산 ${min.result.counts.까막산}판 · 자경구 ${min.result.counts.자경구}판 · 용둥 ${min.result.counts.용둥}판`;card.append(title,label,value,detail,counts)}else{detail.textContent='50~129레벨 범위에서 목표 레벨로 정확히 끝나는 시작 조건이 없어요.';card.append(title,detail)}box.append(card)}}
 function renderParks(counts){let box=$m('monpaParks');box.replaceChildren();for(const [name,cls] of [['까막산','p1'],['자경구','p2'],['용둥','p3']]){let chip=document.createElement('span'),b=document.createElement('b');chip.className='park-chip '+cls+(counts[name]?'':' is-zero');b.textContent=counts[name]+'판';chip.append(name+' ',b);box.append(chip)}}
 // 오늘 날짜(한국 시간). 확인용으로 ?today=2026-12-01 처럼 바꿔 볼 수 있어요.
 const testDay=new URLSearchParams(location.search).get('today');
 const now=testDay&&parseDay(testDay)!==null?testDay:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const daysLeft=Math.round((parseDay(MONPA_EVENT_END)-parseDay(now))/86400000),ended=daysLeft<0;
 for(const id of ['monpaEventPill']){const pill=$m(id);pill.textContent=ended?'이벤트 종료':daysLeft===0?'이벤트 오늘 종료':`이벤트 D-${daysLeft}`;pill.title=`몬파 이벤트 ${koDate(MONPA_EVENT_END)}까지`;pill.classList.toggle('is-ended',ended)}
 for(const el of document.querySelectorAll('[data-event-end]'))el.textContent=koDate(MONPA_EVENT_END);
 for(const id of ['monpaStart','goalStart']){$m(id).value=now;$m(id).max=MONPA_EVENT_END}
 for(const id of ['monpaEnd','goalEnd']){$m(id).value=MONPA_EVENT_END;$m(id).max=MONPA_EVENT_END}
 // 입력값 기억 (이 브라우저에만 저장)
 const saveKey='maple_monpa_state_v1';let saved={};try{saved=JSON.parse(localStorage.getItem(saveKey)||'{}')||{}}catch(e){}
 function save(){try{localStorage.setItem(saveKey,JSON.stringify({level:$m('monpaLevel').value,percent:$m('monpaPercent').value,goals:[100,110,120].filter(x=>$m('goal'+x).checked),custom:$m('goalCustom').value}))}catch(e){}}
 if(typeof saved.level==='string'&&/^\d{1,3}$/.test(saved.level))$m('monpaLevel').value=saved.level;
 if(typeof saved.percent==='string'&&/^\d{1,2}(\.\d{1,4})?$/.test(saved.percent))$m('monpaPercent').value=saved.percent;
 if(Array.isArray(saved.goals))for(const g of [100,110,120])$m('goal'+g).checked=saved.goals.includes(g);
 if(typeof saved.custom==='string'&&/^\d{0,3}$/.test(saved.custom))$m('goalCustom').value=saved.custom;
 function update(){save();let level=$m('monpaLevel').value,p=$m('monpaPercent').value,start=$m('monpaStart').value,end=$m('monpaEnd').value;try{
  if(level===''||p==='')throw Error('현재 레벨과 경험치를 입력해 주세요.');let result=simulateMonpa({level:Number(level),percent:Number(p),start,end});$m('monpaError').textContent='';$m('monpaRange').textContent=`${start} ~ ${end} · 하루 2판`;$m('monpaFinal').textContent=`${result.level}레벨`;$m('monpaFinalPct').textContent=result.percent===null?'':pct(result.percent);$m('monpaGain').textContent=result.level>Number(level)?`+${result.level-Number(level)}레벨`:'레벨 유지';$m('monpaBar').style.width=(result.percent===null?100:result.percent)+'%';$m('monpaFinalExp').textContent=result.percent===null?`130레벨 이후 보상 정보 없음 · 남은 경험치 ${number(result.experience)}`:'';$m('monpaRuns').textContent=`${result.runs}판`;$m('monpaTotal').textContent=number(result.total);renderParks(result.counts);$m('monpaNote').textContent=result.stopped?'130레벨 이후 정보가 없어 계산을 멈췄어요.':'';
  let body=$m('monpaDays');body.replaceChildren();for(const d of result.days){let tr=document.createElement('tr');for(const text of [d.date,d.parks.join(' → '),number(d.gains),`${d.level}레벨${d.percent===null?'':` ${pct(d.percent)}`}`]){let td=document.createElement('td');td.textContent=text;tr.append(td)}body.append(tr)}
 }catch(e){$m('monpaError').textContent=e.message;$m('monpaRange').textContent='입력값을 확인해 주세요.';$m('monpaFinal').textContent='—';for(let id of ['monpaFinalExp','monpaNote','monpaFinalPct','monpaGain'])$m(id).textContent='';$m('monpaBar').style.width='0%';$m('monpaParks').replaceChildren();for(let id of ['monpaRuns','monpaTotal'])$m(id).textContent='—';$m('monpaDays').replaceChildren()}}
 if(!ended){for(let id of ['monpaLevel','monpaPercent','monpaStart','monpaEnd'])$m(id).addEventListener('input',update);update()}
 // 주차 계산기: 몬파 계산기와 별도로 시작일·목표일을 받아 역산
 function updateWeekly(){save();let start=$m('goalStart').value,end=$m('goalEnd').value;try{let s=parseDay(start),e=parseDay(end);if(s===null||e===null||e<s)throw Error('시작일과 목표일을 올바르게 입력해 주세요.');if(e>parseDay(MONPA_EVENT_END))throw Error(`목표 날짜는 이벤트 종료일인 ${koDate(MONPA_EVENT_END)}까지 선택할 수 있어요.`);$m('weeklyError').textContent='';updateReverse(start,end)}catch(err){$m('weeklyError').textContent=err.message;$m('monpaReverse').replaceChildren()}}
 if(!ended){for(let id of ['goalStart','goalEnd','goalCustom'])$m(id).addEventListener('input',updateWeekly);for(let id of ['goal100','goal110','goal120'])$m(id).addEventListener('change',updateWeekly);updateWeekly()}
 // 이벤트가 끝나면 두 계산기를 잠그고 안내를 보여줘요
 else for(const id of ['monpa']){const sec=$m(id);sec.classList.add('is-ended');for(const input of sec.querySelectorAll('input'))input.disabled=true}
}
