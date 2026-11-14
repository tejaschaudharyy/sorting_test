(function(){
'use strict';
const $=s=>document.querySelector(s);
const fmt=v=>Number.isInteger(v)?String(v):String(+v.toFixed(3));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/*ALGO-START*/
/* Every algorithm runs once up front and records each step (with a full snapshot).
   Playback, step back, the step log and the pass table all read from this record. */
class Rec{
  constructor(items){
    this.a=items.slice();this.steps=[];this.comps=0;this.writes=0;this.pass=0;
    this.sorted=new Set();this.passes=[];this.pc=0;this.pw=0;
    this.ptr={};this.bounds=null;this.ns=null;this.node=null;
    this.snap('start',{line:0,msg:'Initial array. Press Start or Step ▶ to begin.'});
  }
  v(i){return this.a[i].v}
  snap(type,o){this.steps.push(Object.assign({type,arr:this.a.slice(),sorted:Array.from(this.sorted),comps:this.comps,writes:this.writes,pass:this.pass,
    ptr:Object.assign({},this.ptr),bounds:this.bounds?Array.from(this.bounds):null,ns:this.ns?this.ns.join(''):null,node:this.node},o));}
  cmp(i,j,line,o){this.comps++;this.pc++;this.snap('compare',Object.assign({i,j,line},o));}
  swap(i,j,line,o){const x=this.v(i),y=this.v(j);const t=this.a[i];this.a[i]=this.a[j];this.a[j]=t;this.writes++;this.pw++;
    this.snap('swap',Object.assign({i,j,line,msg:`Swap ${fmt(x)} and ${fmt(y)}`},o));}
  move(from,to,line,o){const it=this.a.splice(from,1)[0];this.a.splice(to,0,it);this.writes++;this.pw++;
    this.snap('swap',Object.assign({i:to,j:null,line,action:'Move'},o));}
  addWrites(k){this.writes+=k;this.pw+=k;}
  info(line,msg,o){this.snap('info',Object.assign({line,msg},o));}
  startPass(){this.pass++;this.pc=0;this.pw=0;}
  endPass(line,msg,o,label){this.snap('pass',Object.assign({line,msg},o));
    this.passes.push({pass:this.pass,label:label||String(this.pass),arr:this.a.map(x=>x.v),comps:this.pc,writes:this.pw,step:this.steps.length-1});}
  done(line){for(let k=0;k<this.a.length;k++)this.sorted.add(k);
    this.ptr={};if(this.bounds)this.bounds.clear();if(this.ns)this.ns=this.ns.map(()=>3);this.node=null;
    this.snap('done',{line,msg:`Sorted in ${this.pass} pass${this.pass===1?'':'es'} with ${this.comps} comparisons and ${this.writes} ${this.writes===1?'write':'writes'}.`});return this;}
}

function bubble(items){
  const r=new Rec(items),n=r.a.length;
  r.steps[0].line=7;
  for(let i=0;i<n-1;i++){
    r.startPass();r.ptr={};
    r.info(7,`Pass ${i+1} (i = ${i}): the largest remaining value will end up at index ${n-i-1}`);
    for(let j=0;j<n-i-1;j++){
      const x=r.v(j),y=r.v(j+1);r.ptr={j:j,'j+1':j+1};
      r.cmp(j,j+1,11,{msg:`Is a[j] = ${fmt(x)} > a[j + 1] = ${fmt(y)}? ${x>y?'Yes, so swap them':'No, leave them'}`});
      if(x>y)r.swap(j,j+1,12,{msg:`swap(a[${j}], a[${j+1}]): ${fmt(x)} moves right`});
    }
    r.sorted.add(n-i-1);r.ptr={};
    r.endPass(9,`Pass ${i+1} complete: ${fmt(r.v(n-i-1))} is locked in at index ${n-i-1}`);
  }
  return r.done(17);
}

function selection(items){
  const r=new Rec(items),n=r.a.length;
  r.steps[0].line=7;
  for(let i=0;i<n-1;i++){
    r.startPass();let m=i;r.ptr={i:i,min:m};
    r.info(9,`Pass ${i+1}: min = i = ${i}. Look for the smallest value in indices ${i} to ${n-1}`,{key:m});
    for(let j=i+1;j<n;j++){
      const x=r.v(j),y=r.v(m);r.ptr={i:i,j:j,min:m};
      r.cmp(j,m,12,{key:m,msg:`Is a[j] = ${fmt(x)} < a[min] = ${fmt(y)}? ${x<y?'Yes':'No'}`});
      if(x<y){m=j;r.ptr={i:i,j:j,min:m};r.info(13,`min = j = ${j} (value ${fmt(x)})`,{key:m,action:'New min'});}
    }
    r.ptr={i:i,min:m};
    r.swap(i,m,16,{msg:m!==i?`swap(a[${i}], a[${m}]): the minimum ${fmt(r.v(m))} moves to index ${i}`:`swap(a[${i}], a[${i}]): the minimum is already at index ${i}, so nothing moves`});
    r.sorted.add(i);r.ptr={};
    r.endPass(16,`Pass ${i+1} complete: index ${i} holds its final value`);
  }
  return r.done(19);
}

function insertion(items){
  const r=new Rec(items),n=r.a.length;
  r.steps[0].line=7;
  for(let i=1;i<n;i++){
    r.startPass();const key=r.v(i);let j=i;r.ptr={i:i,key:j};
    r.info(8,`Pass ${i}: key = a[${i}] = ${fmt(key)} and j = i - 1 = ${i-1}`,{key:j});
    while(j>0){
      const x=r.v(j-1);r.ptr={i:i,key:j,j:j-1};
      r.cmp(j-1,j,11,{key:j,msg:`j = ${j-1}: is a[j] = ${fmt(x)} > key ${fmt(key)}? ${x>key?'Yes, so a[j + 1] = a[j] and j--':'No, so the loop stops'}`});
      if(x>key){r.ptr={i:i,key:j-1};r.swap(j-1,j,12,{key:j-1,action:'Shift',msg:`a[${j}] = a[${j-1}]: ${fmt(x)} shifts right and j becomes ${j-2}`});j--;}
      else break;
    }
    r.ptr={i:i,key:j};
    r.endPass(16,`a[j + 1] = key: ${fmt(key)} is placed at index ${j}${j===0?' (j reached -1, so the loop stopped)':''}`);
  }
  return r.done(19);
}

/* Top-down merge sort, following the C++ code: mid = (low + high) / 2, left = low..mid, right = mid+1..high.
   bounds = gaps drawn between subarrays, ns = state of each call (0 not reached, 1 divided, 2 merging, 3 sorted). */
function merge(items){
  const r=new Rec(items),n=r.a.length;r.kind='merge';
  r.steps[0].line=60;
  const split=(lo,hi)=>Math.floor((lo+hi-1)/2)+1;
  const nodes=[];
  (function build(lo,hi,d){const id=nodes.length,nd={lo,hi,d,kids:null};nodes.push(nd);
    if(hi-lo>1){const m=split(lo,hi);const a=build(lo,m,d+1),b=build(m,hi,d+1);nd.kids=[a,b];}return id;})(0,n,0);
  nodes[0].orig=r.a.slice();
  r.nodes=nodes;r.ns=nodes.map(()=>0);r.bounds=new Set();
  let nid=0;
  function sort(lo,hi){
    const id=nid++;r.node=id;
    if(hi-lo<=1){nodes[id].sortedItems=[r.a[lo]];r.ns[id]=3;r.ptr={};r.info(44,`mergeSort(a, ${lo}, ${lo}): low < high is false, so one element is already sorted`,{key:lo,action:'Base case'});return;}
    const m=split(lo,hi),mid=m-1;
    nodes[nodes[id].kids[0]].orig=r.a.slice(lo,m);nodes[nodes[id].kids[1]].orig=r.a.slice(m,hi);
    r.ns[id]=1;r.bounds.add(m);r.ptr={mid:mid};
    r.info(46,`mergeSort(a, ${lo}, ${hi-1}): mid = (${lo} + ${hi-1}) / 2 = ${mid}. Left half ${lo}–${mid}, right half ${m}–${hi-1}`,{range:[lo,lo,m,hi],action:'Divide'});
    sort(lo,m);
    r.node=id;r.ptr={};
    r.info(49,`Left half ${lo}–${mid} is sorted. Now mergeSort(a, ${m}, ${hi-1})`,{range:[lo,m,m,hi],action:'Recurse'});
    sort(m,hi);
    r.node=id;r.ns[id]=2;r.startPass();
    let i=lo,j=m;
    const IJ=(a,b)=>{r.ptr={};if(a<b)r.ptr.i=a;if(b<hi)r.ptr.j=b;};
    IJ(i,j);
    r.info(51,`merge(a, ${lo}, ${mid}, ${hi-1}): i = ${lo}, j = ${m}, k = 0. Fill temp[] in sorted order`,{range:[lo,i,j,hi],action:'Merge'});
    while(i<j&&j<hi){
      const x=r.v(i),y=r.v(j);IJ(i,j);
      r.cmp(i,j,13,{range:[lo,i,j,hi],msg:`Is a[i] = ${fmt(x)} < a[j] = ${fmt(y)}? ${x<y?'Yes, take a[i]':'No, take a[j]'}`});
      if(x<y){r.addWrites(1);i++;IJ(i,j);r.info(14,`temp[k] = a[i] = ${fmt(x)}, then i++ and k++`,{range:[lo,i,j,hi],action:'Take'});}
      else{r.bounds.delete(j);if(j+1<hi)r.bounds.add(j+1);IJ(i+1,j+1);
        r.move(j,i,18,{range:[lo,i+1,j+1,hi],msg:`temp[k] = a[j] = ${fmt(y)}, then j++ and k++`});i++;j++;}
    }
    if(j<hi)r.bounds.delete(j);
    const rest=hi-i,leftSide=i<j;
    if(rest>0){r.addWrites(rest);r.ptr={};r.info(leftSide?26:32,`One half is used up. Copy the ${rest} leftover value${rest>1?'s':''} from the ${leftSide?'left':'right'} half into temp[]`,{range:[lo,hi,hi,hi],action:'Copy'});}
    r.addWrites(hi-lo);
    r.info(38,`Copy temp[] back into a[${lo}..${hi-1}]`,{range:[lo,hi,hi,hi],action:'Copy back'});
    nodes[id].sortedItems=r.a.slice(lo,hi);r.ns[id]=3;r.ptr={};
    r.endPass(51,`Merged: indices ${lo}–${hi-1} are now one sorted subarray`,{range:[lo,hi,hi,hi]},`${lo}–${hi-1}`);
  }
  if(n>1)sort(0,n);
  r.done(62);
  r.steps[r.steps.length-1].msg=`Sorted with ${r.pass} merges, ${r.comps} comparisons and ${r.writes} writes.`;
  return r;
}

/* Quick sort with Lomuto partition (pivot = a[high]), following the C++ code.
   ns: 0 not started, 1 partitioned and split, 2 partitioning, 3 sorted. */
function quick(items){
  const r=new Rec(items),n=r.a.length;r.kind='quick';
  r.steps[0].line=37;
  const nodes=[];r.nodes=nodes;r.ns=[];
  const mk=(lo,hi,d,parent)=>{const id=nodes.length;nodes.push({lo,hi,d,kids:[],parent,orig:r.a.slice(lo,hi)});r.ns.push(0);if(parent!=null)nodes[parent].kids.push(id);return id;};
  function qs(id){
    const nd=nodes[id],lo=nd.lo,hi=nd.hi,high=hi-1;r.node=id;
    if(hi-lo===1){r.ns[id]=3;r.sorted.add(lo);r.ptr={};r.info(23,`quickSort(a, ${lo}, ${lo}): low < high is false, so a single element is already in place`,{key:lo,action:'Base case'});return;}
    r.ns[id]=2;r.startPass();
    const pivot=r.v(high);let i=lo-1;
    r.ptr={pivot:high};
    r.info(5,`quickSort(a, ${lo}, ${high}) calls partition: pivot = a[high] = ${fmt(pivot)}`,{piv:high,action:'Pivot'});
    r.ptr={i:i,pivot:high};
    r.info(6,`i = low - 1 = ${i}. Values smaller than the pivot will be collected at the front`,{piv:high,part:[lo,i,lo,hi]});
    for(let j=lo;j<high;j++){
      const x=r.v(j);r.ptr={i:i,j:j,pivot:high};
      r.cmp(j,high,10,{piv:high,part:[lo,i,j,hi],msg:`Is a[j] = ${fmt(x)} < pivot ${fmt(pivot)}? ${x<pivot?'Yes: i++, then swap a[i] and a[j]':'No: j moves on'}`});
      if(x<pivot){i++;r.ptr={i:i,j:j,pivot:high};
        r.swap(i,j,12,{piv:high,part:[lo,i,j+1,hi],msg:i===j?`i = ${i}. swap(a[${i}], a[${j}]) swaps a value with itself, nothing moves`:`i = ${i}. swap(a[${i}], a[${j}]): ${fmt(x)} joins the smaller side`});}
    }
    const p=i+1;r.ptr={'i+1':p,pivot:high};
    r.swap(p,high,16,{piv:p,part:[lo,i,hi,hi],msg:`swap(a[i + 1], a[high]): pivot ${fmt(pivot)} moves to index ${p}, its final position`});
    r.sorted.add(p);nd.p=p;nd.after=r.a.slice(lo,hi);
    const L=p>lo?mk(lo,p,nd.d+1,id):null,R=p+1<hi?mk(p+1,hi,nd.d+1,id):null;
    r.ns[id]=1;r.ptr={p:p};
    const parts=[L!=null?`left ${lo}–${p-1}`:'an empty left side',R!=null?`right ${p+1}–${high}`:'an empty right side'];
    r.endPass(18,`partition returns p = ${p}. Pivot ${fmt(pivot)} is fixed; split into ${parts.join(' and ')}`,{piv:p,action:'Split'},`${lo}–${high}`);
    if(L!=null){r.node=id;r.ptr={p:p};r.info(27,`quickSort(a, ${lo}, ${p-1}): sort the left part`,{piv:p,action:'Recurse'});qs(L);}
    if(R!=null){r.node=id;r.ptr={p:p};r.info(28,`quickSort(a, ${p+1}, ${high}): sort the right part`,{piv:p,action:'Recurse'});qs(R);}
    r.node=id;r.ns[id]=3;r.ptr={};for(let k=lo;k<hi;k++)r.sorted.add(k);
    r.info(29,`quickSort(a, ${lo}, ${high}) is finished: indices ${lo}–${high} are sorted`,{action:'Return'});
  }
  qs(mk(0,n,0,null));
  r.done(39);
  r.steps[r.steps.length-1].msg=`Sorted with ${r.pass} partitions, ${r.comps} comparisons and ${r.writes} swaps.`;
  return r;
}

/* Plain versions (no recording) used only for CPU timing */
const PLAIN={
  bubble(a){const n=a.length;for(let i=0;i<n-1;i++)for(let j=0;j<n-i-1;j++)if(a[j]>a[j+1]){const t=a[j];a[j]=a[j+1];a[j+1]=t;}return a;},
  selection(a){const n=a.length;for(let i=0;i<n-1;i++){let m=i;for(let j=i+1;j<n;j++)if(a[j]<a[m])m=j;const t=a[i];a[i]=a[m];a[m]=t;}return a;},
  insertion(a){for(let i=1;i<a.length;i++){const k=a[i];let j=i-1;while(j>=0&&a[j]>k){a[j+1]=a[j];j--;}a[j+1]=k;}return a;},
  merge(a){const t=new Array(a.length);const ms=(lo,hi)=>{if(lo>=hi)return;const mid=(lo+hi)>>1;ms(lo,mid);ms(mid+1,hi);let i=lo,j=mid+1,k=0;while(i<=mid&&j<=hi)t[k++]=a[i]<a[j]?a[i++]:a[j++];while(i<=mid)t[k++]=a[i++];while(j<=hi)t[k++]=a[j++];for(i=lo,k=0;i<=hi;i++,k++)a[i]=t[k];};ms(0,a.length-1);return a;},
  quick(a){const qs=(lo,hi)=>{if(lo>=hi)return;const pv=a[hi];let i=lo-1;for(let j=lo;j<hi;j++)if(a[j]<pv){i++;const t=a[i];a[i]=a[j];a[j]=t;}const t=a[i+1];a[i+1]=a[hi];a[hi]=t;qs(lo,i);qs(i+2,hi);};qs(0,a.length-1);return a;}
};
/*ALGO-END*/

const CODE={"insertion": ["#include <iostream>", "using namespace std;", "", "int main() {", "    int a[] = {5, 3, 4, 1, 2};", "    int n = 5;", "", "    for (int i = 1; i < n; i++) {", "        int key = a[i];", "        int j = i - 1;", "", "        while (j >= 0 && a[j] > key) {", "            a[j + 1] = a[j];", "            j--;", "        }", "", "        a[j + 1] = key;", "    }", "", "    for (int i = 0; i < n; i++)", "        cout << a[i] << \" \";", "", "    return 0;", "}"], "selection": ["#include <iostream>", "using namespace std;", "", "int main() {", "    int a[] = {5, 3, 4, 1, 2};", "    int n = 5;", "", "    for (int i = 0; i < n - 1; i++) {", "", "        int min = i;", "", "        for (int j = i + 1; j < n; j++) {", "            if (a[j] < a[min])", "                min = j;", "        }", "", "        swap(a[i], a[min]);", "    }", "", "    for (int i = 0; i < n; i++)", "        cout << a[i] << \" \";", "", "    return 0;", "}"], "bubble": ["#include <iostream>", "using namespace std;", "", "int main() {", "    int a[] = {5, 3, 4, 1, 2};", "    int n = 5;", "", "    for (int i = 0; i < n - 1; i++) {", "", "        for (int j = 0; j < n - i - 1; j++) {", "", "            if (a[j] > a[j + 1]) {", "                swap(a[j], a[j + 1]);", "            }", "        }", "    }", "", "    for (int i = 0; i < n; i++)", "        cout << a[i] << \" \";", "", "    return 0;", "}"], "merge": ["#include <iostream>", "using namespace std;", "", "void merge(int a[], int low, int mid, int high) {", "", "    int i = low;", "    int j = mid + 1;", "    int k = 0;", "", "    int temp[100];", "", "    while (i <= mid && j <= high) {", "", "        if (a[i] < a[j]) {", "            temp[k] = a[i];", "            i++;", "        }", "        else {", "            temp[k] = a[j];", "            j++;", "        }", "", "        k++;", "    }", "", "    while (i <= mid) {", "        temp[k] = a[i];", "        i++;", "        k++;", "    }", "", "    while (j <= high) {", "        temp[k] = a[j];", "        j++;", "        k++;", "    }", "", "    for (i = low, k = 0; i <= high; i++, k++) {", "        a[i] = temp[k];", "    }", "}", "", "void mergeSort(int a[], int low, int high) {", "", "    if (low < high) {", "", "        int mid = (low + high) / 2;", "", "        mergeSort(a, low, mid);", "        mergeSort(a, mid + 1, high);", "", "        merge(a, low, mid, high);", "    }", "}", "", "int main() {", "", "    int a[] = {5, 3, 4, 1, 2};", "    int n = 5;", "", "    mergeSort(a, 0, n - 1);", "", "    for (int i = 0; i < n; i++)", "        cout << a[i] << \" \";", "", "    return 0;", "}"], "quick": ["#include <iostream>", "using namespace std;", "", "int partition(int a[], int low, int high) {", "", "    int pivot = a[high];", "    int i = low - 1;", "", "    for (int j = low; j < high; j++) {", "", "        if (a[j] < pivot) {", "            i++;", "            swap(a[i], a[j]);", "        }", "    }", "", "    swap(a[i + 1], a[high]);", "", "    return i + 1;", "}", "", "void quickSort(int a[], int low, int high) {", "", "    if (low < high) {", "", "        int p = partition(a, low, high);", "", "        quickSort(a, low, p - 1);", "        quickSort(a, p + 1, high);", "    }", "}", "", "int main() {", "", "    int a[] = {5, 3, 4, 1, 2};", "    int n = 5;", "", "    quickSort(a, 0, n - 1);", "", "    for (int i = 0; i < n; i++)", "        cout << a[i] << \" \";", "", "    return 0;", "}"]};
const ALGO_KEYS=['bubble','selection','insertion','merge','quick'];
const ALGOS={
  bubble:{name:'Bubble Sort',run:bubble,color:'#5b6cf0',writeLbl:'Swaps',passLbl:'Passes',passWord:'pass',pseudo:CODE.bubble,
    cx:{best:'O(n²)',avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'Yes',inplace:'Yes'},
    desc:'Bubble Sort walks through the array comparing each pair of neighbours and swaps them when they are in the wrong order. After every pass, the largest value that is not yet sorted has "bubbled" to the end.',
    how:['The outer loop runs n − 1 passes (i = 0 to n − 2).','The inner loop compares a[j] and a[j + 1] for j = 0 to n − i − 2.','If a[j] > a[j + 1], they are swapped.','After pass i, the last i + 1 positions hold their final values.'],
    why:[['Time O(n²) in every case','This code has no early-exit check, so it always makes (n−1)+(n−2)+…+1 = n(n−1)/2 comparisons, even when the array is already sorted. (Adding a "swapped" flag would make the best case O(n).)'],['Swaps depend on the input','Zero swaps for a sorted array, n(n−1)/2 for a reverse sorted one.'],['Space O(1)','Only a temporary variable is needed for swapping. Everything happens inside the array.']]},
  selection:{name:'Selection Sort',run:selection,color:'#e0539a',writeLbl:'Swaps',passLbl:'Passes',passWord:'pass',pseudo:CODE.selection,
    cx:{best:'O(n²)',avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'No',inplace:'Yes'},
    desc:'Selection Sort repeatedly finds the smallest value in the unsorted part and swaps it to the front of that part. The sorted section grows from left to right by one element each pass.',
    how:['Set min = i, the first unsorted index.','Scan j = i + 1 to n − 1, and set min = j whenever a[j] < a[min].','swap(a[i], a[min]) puts the smallest value at index i.','Repeat for i = 0 to n − 2.'],
    why:[['Time O(n²) in every case','It always scans the whole unsorted part, so it makes n(n−1)/2 comparisons even when the array is already sorted.'],['Exactly n − 1 swaps','This code swaps once per pass, even when min = i (the value swaps with itself). That is the fewest writes of the O(n²) sorts.'],['Space O(1)','Only the index min and a swap variable are stored.']]},
  insertion:{name:'Insertion Sort',run:insertion,color:'#12a594',writeLbl:'Shifts',passLbl:'Passes',passWord:'pass',pseudo:CODE.insertion,
    cx:{best:'O(n)',avg:'O(n²)',worst:'O(n²)',space:'O(1)',stable:'Yes',inplace:'Yes'},
    desc:'Insertion Sort builds the sorted array one element at a time, the way you sort playing cards in your hand. Each key slides left past every bigger value until it reaches its place.',
    how:['key = a[i] is the next value to insert; j = i − 1.','While j ≥ 0 and a[j] > key, shift a[j] one place right (a[j + 1] = a[j]) and decrease j.','When the loop stops, a[j + 1] = key drops the key into the gap.','Repeat for i = 1 to n − 1.'],
    why:[['Best time O(n)','If the array is already sorted, each key needs just one comparison and no shifts.'],['Average and worst time O(n²)','In reverse order, key i shifts past all i values before it: 1+2+…+(n−1) = n(n−1)/2.'],['Space O(1)','Only the key is held aside while the others shift.']]},
  merge:{name:'Merge Sort',run:merge,color:'#ef7d2d',writeLbl:'Writes',passLbl:'Merges',passWord:'merge',pseudo:CODE.merge,
    cx:{best:'O(n log n)',avg:'O(n log n)',worst:'O(n log n)',space:'O(n)',stable:'Only with <=',inplace:'No'},
    desc:'Merge Sort is divide and conquer. It keeps splitting the array in half until every piece has one element, then merges the pieces back together in sorted order using a temp[] array.',
    how:['mid = (low + high) / 2 splits the range into low..mid and mid + 1..high.','mergeSort calls itself on both halves until low < high is false (one element).','merge() walks i through the left half and j through the right half, copying the smaller value into temp[k].','Leftovers are copied into temp[], then temp[] is copied back into a[low..high].'],
    why:[['Time O(n log n) in every case','Halving n gives about log₂ n levels of calls, and the merges on each level touch all n elements once. The input order does not change this.'],['Space O(n)','temp[] holds up to n values during a merge, plus O(log n) stack space for the recursion.'],['Stability','This code uses a[i] < a[j], so on a tie it takes from the right half first and equal values can swap order. Changing it to a[i] <= a[j] makes Merge Sort stable.']]},
  quick:{name:'Quick Sort',run:quick,color:'#0ea5e9',writeLbl:'Swaps',passLbl:'Partitions',passWord:'partition',pseudo:CODE.quick,
    cx:{best:'O(n log n)',avg:'O(n log n)',worst:'O(n²)',space:'O(log n)',stable:'No',inplace:'Yes'},
    desc:'Quick Sort picks a pivot (here the last element, a[high]) and partitions the range so every value smaller than the pivot comes before it. The pivot then sits in its final place, and the two sides are sorted the same way.',
    how:['pivot = a[high], and i = low − 1 marks the end of the "smaller than pivot" section.','j scans from low to high − 1. When a[j] < pivot, i moves right and a[i] swaps with a[j].','swap(a[i + 1], a[high]) drops the pivot at p = i + 1, its final position.','quickSort is called on low..p − 1 and p + 1..high.'],
    why:[['Best and average time O(n log n)','When pivots split the range roughly in half, there are about log₂ n levels of calls and each level does about n comparisons.'],['Worst time O(n²)','With the last element as pivot, an already sorted or reverse sorted array gives the most lopsided split every time: (n−1)+(n−2)+… comparisons. Try the Reverse sorted preset to see it.'],['Space O(log n) on average','It sorts in place, but the recursion stack is about log₂ n deep on average and up to n deep in the worst case.']]}
};
const S={mview:'split',values:[],items:[],records:{},algo:'bubble',mode:'single',preset:'random',players:[],playing:false,timer:null,elapsed:0,lastT:0,speed:5,passShown:0,logRow:null,livePts:[]};
const charts={};

/* ---------- Visualizer ---------- */
const GAP=0.9; /* width of a divide gap, in bar widths */
const PTR_CLS={i:'i',j:'j','j+1':'j','j-1':'j',min:'min',key:'key',L:'l',R:'r',mid:'mid',pivot:'min','i+1':'i',p:'p'};
class Viz{
  constructor(plot,idxRow,ptrRow){this.plot=plot;this.idxRow=idxRow;this.ptrRow=ptrRow;this.bars=new Map();this.ptrs=new Map();this.idx=[];this.n=0;}
  load(items,mini){
    const p=this.plot;p.innerHTML='';this.bars.clear();
    const n=items.length,vals=items.map(i=>i.v);this.n=n;
    const mn=Math.min(0,...vals),mx=Math.max(0,...vals),range=(mx-mn)||1;
    p.classList.toggle('dense',n>20);
    p.classList.toggle('nolbl',n>(mini?16:30));
    p.classList.remove('done');
    if(mn<0){const z=document.createElement('div');z.className='zero';z.style.top=(mx/range*100)+'%';p.appendChild(z);}
    for(const it of items){
      const el=document.createElement('div');el.className='bar';
      const top=(mx-Math.max(it.v,0))/range*100,h=Math.abs(it.v)/range*100;
      const f=document.createElement('div');f.className='fill';f.style.top=top+'%';f.style.height=`max(${h}%, 3px)`;
      const l=document.createElement('span');l.className='lbl';l.textContent=fmt(it.v);
      l.style.top=it.v>=0?`calc(${top}% - 16px)`:`calc(${top+h}% + 3px)`;
      el.append(f,l);p.appendChild(el);this.bars.set(it.id,el);
    }
    this.idx=[];
    if(this.idxRow){this.idxRow.innerHTML='';this.idxRow.classList.toggle('nolbl',n>30);
      for(let k=0;k<n;k++){const s=document.createElement('span');s.textContent=k;this.idxRow.appendChild(s);this.idx.push(s);}}
    if(this.ptrRow){this.ptrRow.innerHTML='';this.ptrs.clear();}
  }
  layout(bounds){
    const n=this.n,b=(bounds||[]).slice().sort((x,y)=>x-y),unit=100/(n+b.length*GAP),left=new Array(n);
    let g=0;for(let k=0;k<n;k++){while(g<b.length&&b[g]<=k)g++;left[k]=(k+g*GAP)*unit;}
    return{unit,left};
  }
  render(st,instant){
    const p=this.plot,L=this.layout(st.bounds),cls=classesFor(st),rows=[p,this.idxRow,this.ptrRow].filter(Boolean);
    if(instant)rows.forEach(r=>r.classList.add('noanim'));
    st.arr.forEach((it,k)=>{const el=this.bars.get(it.id);if(!el)return;
      el.style.left=L.left[k]+'%';el.style.width=L.unit+'%';el.style.setProperty('--k',k);
      el.className='bar'+(cls[k]?' '+cls[k]:'');});
    this.idx.forEach((s,k)=>{s.style.left=L.left[k]+'%';s.style.width=L.unit+'%';});
    if(this.ptrRow){
      const P=st.ptr||{},lvl={},seen=new Set();
      for(const name of Object.keys(P)){
        const k=P[name];if(k==null||k<0||k>=this.n)continue;seen.add(name);
        let el=this.ptrs.get(name);const x=(L.left[k]+L.unit/2)+'%';
        if(!el){el=document.createElement('div');el.className='ptr p-'+(PTR_CLS[name]||'i');el.innerHTML=`<i>▲</i><span>${esc(name)}</span>`;
          el.style.left=x;this.ptrRow.appendChild(el);this.ptrs.set(name,el);}
        const lv=lvl[k]||0;lvl[k]=lv+1;
        el.style.left=x;el.style.top=(lv===0?0:12+lv*18)+'px';el.classList.toggle('stk',lv>0);
      }
      for(const[name,el]of this.ptrs)if(!seen.has(name)){el.remove();this.ptrs.delete(name);}
    }
    if(instant){void p.offsetWidth;rows.forEach(r=>r.classList.remove('noanim'));}
  }
  setDone(on){if(on&&!this.plot.classList.contains('done')){void this.plot.offsetWidth;}this.plot.classList.toggle('done',on);}
}
const mainViz=new Viz($('#mainPlot'),$('#idxRow'),$('#ptrRow'));
let minis=[];

function classesFor(st){
  const c={};const set=(k,v)=>{if(k!=null&&k>=0)c[k]=v;};
  st.sorted.forEach(k=>c[k]='srt');
  if(st.range){const[lo,i,j,hi]=st.range;for(let k=lo;k<hi;k++)c[k]=k<i?'mrg':(k<j?'runl':'runr');}
  if(st.part){const[lo,i,j]=st.part;for(let k=lo;k<=i;k++)c[k]='runl';for(let k=Math.max(lo,i+1);k<j;k++)c[k]='runr';}
  if(st.key!=null)set(st.key,'key');
  if(st.piv!=null)set(st.piv,'key');
  if(st.type==='compare'){set(st.i,'cmp');set(st.j,'cmp');}
  if(st.type==='swap'){set(st.i,'swp');if(st.j!=null)set(st.j,'swp');}
  return c;
}
function actionLabel(st){return st.action||{start:'Start',compare:'Compare',swap:'Swap',info:'Note',pass:'Pass end',done:'Done'}[st.type];}
function idxText(st){
  if(st.type==='compare')return `${st.i}, ${st.j}`;
  if(st.type==='swap')return st.j!=null?`${st.i} ↔ ${st.j}`:`→ ${st.i}`;
  if(st.key!=null)return `key @ ${st.key}`;
  if(st.range)return `${st.range[0]}–${st.range[3]-1}`;
  return '—';
}
function valText(st){
  const a=st.arr;
  if(st.type==='compare')return `${fmt(a[st.i].v)} vs ${fmt(a[st.j].v)}`;
  if(st.type==='swap')return st.j!=null?`${fmt(a[st.i].v)} ↔ ${fmt(a[st.j].v)}`:fmt(a[st.i].v);
  if(st.key!=null)return `key ${fmt(a[st.key].v)}`;
  return '—';
}

/* ---------- Legend ---------- */
function buildLegend(el){
  const items=[['var(--bar)','Unsorted'],['var(--cmp)','Comparing'],['var(--swp)','Swapping / moving'],['var(--srt)','Sorted'],['var(--key)','Key / minimum'],['var(--runl)','Left run'],['var(--runr)','Right run'],['var(--mrg)','Sorted subarray']];
  el.innerHTML=items.map(([c,t])=>`<span><i style="background:${c}"></i>${t}</span>`).join('');
}
function refreshLegend(){
  const show=S.mode==='compare'||S.algo==='merge';
  [$('#legend'),$('#legend2')].forEach(l=>{Array.from(l.children).forEach((s,k)=>{s.hidden=k>=5&&!show;});});
}

/* ---------- Data ---------- */
function genValues(n,preset){
  const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;let v;
  if(preset==='nearly'){v=Array.from({length:n},(_,i)=>Math.round(5+i*(90/Math.max(1,n-1))));
    for(let k=0;k<Math.max(1,Math.floor(n/8));k++){const i=rnd(0,n-2);const t=v[i];v[i]=v[i+1];v[i+1]=t;}}
  else if(preset==='reverse')v=Array.from({length:n},(_,i)=>Math.round(95-i*(90/Math.max(1,n-1))));
  else if(preset==='few'){const pool=[15,40,65,90];v=Array.from({length:n},()=>pool[rnd(0,3)]);}
  else v=Array.from({length:n},()=>rnd(5,99));
  return v;
}
function parseInput(str){
  const parts=str.trim().split(/[\s,;]+/).filter(Boolean);
  if(!parts.length)return{error:'Type at least 2 numbers separated by commas or spaces, for example 34, 12, 5, 67.'};
  const bad=parts.find(p=>!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(p));
  if(bad!==undefined)return{error:`"${bad}" is not a number. Use digits, a minus sign or a decimal point only.`};
  const v=parts.map(Number);
  if(v.length<2)return{error:'Add at least one more number. Sorting needs 2 or more elements.'};
  if(v.length>50)return{error:`You entered ${v.length} numbers. The maximum is 50, so remove ${v.length-50}.`};
  if(v.some(x=>Math.abs(x)>1e6))return{error:'Keep each value between −1,000,000 and 1,000,000.'};
  return{vals:v};
}
function showErr(msg,input){$('#inErr').textContent=msg||'';document.querySelectorAll('input.invalid').forEach(i=>i.classList.remove('invalid'));if(msg&&input)input.classList.add('invalid');}

function timeAlgo(k,vals){const f=PLAIN[k],reps=1000;const t0=performance.now();for(let r=0;r<reps;r++)f(vals.slice());return(performance.now()-t0)/reps*1000;}

function setValues(vals){
  S.values=vals.slice();S.items=vals.map((v,id)=>({id,v}));
  S.records={};ALGO_KEYS.forEach(k=>S.records[k]=ALGOS[k].run(S.items));
  $('#nRange').value=vals.length;$('#nNum').value=vals.length;
  $('#origN').textContent=vals.length;$('#origArr').textContent='['+vals.map(fmt).join(', ')+']';
  if(!$('#manualPanel').hidden)buildManual();
  updateResults();updateCompareChart();updateGrowthChart();
  rebuild();
}

/* ---------- Build views ---------- */
function rebuild(){
  stop();S.elapsed=0;
  if(S.mode==='single'){
    const r=S.records[S.algo];
    S.players=[{key:S.algo,rec:r,steps:r.steps,idx:0}];
    mainViz.load(S.items,false);buildCode();buildStepLog();resetPassTable();resetLiveChart();
    const wl=ALGOS[S.algo].writeLbl;$('#sWriteLbl').textContent=wl;$('#passWriteTh').textContent=wl;
    const A=ALGOS[S.algo],pw=A.passWord;$('#sPassLbl').textContent=A.passLbl+' completed';$('#sCurLbl').textContent='Current '+pw;
    $('#passTh').textContent=pw[0].toUpperCase()+pw.slice(1);$('#passArrTh').textContent='Array after '+pw;
    const pc=$('.two .card .sub');if(pc)pc.textContent='Array after each '+pw;
    msView.reset();applyViewVisibility();
  }else{
    S.players=ALGO_KEYS.map(k=>({key:k,rec:S.records[k],steps:S.records[k].steps,idx:0}));
    buildMinis();
  }
  $('#scrub').max=Math.max(...S.players.map(p=>p.steps.length-1));
  renderAll(true);
}
function scrollCode(line){const box=$('#code'),li=box.children[line];if(!li)return;
  if(li.offsetTop<box.scrollTop+20||li.offsetTop+li.offsetHeight>box.scrollTop+box.clientHeight-20)box.scrollTop=li.offsetTop-box.clientHeight/2;}
function buildCode(){$('#code').innerHTML=ALGOS[S.algo].pseudo.map(l=>`<li>${esc(l)}</li>`).join('');}
function buildStepLog(){
  const p=S.players[0],tb=$('#logBody'),frag=document.createDocumentFragment();
  p.steps.forEach((st,k)=>{const tr=document.createElement('tr');tr.title=st.msg;
    tr.innerHTML=`<td class="mono">${k}</td><td><span class="tag t-${st.type}">${actionLabel(st)}</span></td><td class="mono">${idxText(st)}</td><td class="mono">${valText(st)}</td><td class="mono arr">${st.arr.map(x=>fmt(x.v)).join(', ')}</td>`;
    frag.appendChild(tr);});
  tb.innerHTML='';tb.appendChild(frag);S.logRow=null;$('#logBox').scrollTop=0;
  $('#logCount').textContent=`${p.steps.length-1} steps recorded`;
}
function resetPassTable(){$('#passBody').innerHTML='';S.passShown=0;$('#passEmpty').hidden=false;}
function updatePassTable(p){
  const done=p.rec.passes.filter(x=>x.step<=p.idx);
  if(done.length<S.passShown)resetPassTable();
  const tb=$('#passBody');
  for(let k=S.passShown;k<done.length;k++){const ps=done[k],tr=document.createElement('tr');tr.className='new';
    tr.innerHTML=`<td class="mono">${S.algo==='merge'||S.algo==='quick'?'#'+ps.pass+' ('+ps.label+')':ps.pass}</td><td class="mono arr">[${ps.arr.map(fmt).join(', ')}]</td><td class="mono">${ps.comps}</td><td class="mono">${ps.writes}</td>`;tb.appendChild(tr);}
  S.passShown=done.length;$('#passEmpty').hidden=done.length>0;
}
function highlightLog(idx){
  const row=$('#logBody').rows[idx];if(!row)return;
  if(S.logRow)S.logRow.classList.remove('cur');row.classList.add('cur');S.logRow=row;
  const box=$('#logBox');box.scrollTop=row.offsetTop-box.clientHeight/2+row.offsetHeight/2;
}
/* ---------- Merge Sort split view ----------
   Each node of the recursion is drawn as a row of boxes on its own level.
   Divide: the selected subarray is copied into two halves on the row below.
   Merge: the parent row is emptied and refilled one value at a time from the children. */
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
class MSView{
  constructor(stage,canvas){this.stage=stage;this.c=canvas;this.cells=new Map();this.frames=new Map();this.prev=new Map();}
  reset(){this.c.innerHTML='';this.cells.clear();this.frames.clear();this.prev=new Map();}
  mergeCells(st,nodes,vis,S_){
    const out=[];const merging=vis.find(id=>S_(id)==='2');
    let prefix=[];
    if(merging!=null){const nd=nodes[merging],i=st.range?st.range[1]:nd.lo;prefix=st.arr.slice(nd.lo,Math.max(nd.lo,i));}
    const used=new Set(prefix.map(x=>x.id)),kids=new Set(merging!=null?nodes[merging].kids:[]);
    const cmpIds=new Set();if(st.type==='compare'&&merging!=null){cmpIds.add(st.arr[st.i].id);cmpIds.add(st.arr[st.j].id);}
    const P=st.ptr||{},tagIds={};if(P.i!=null)tagIds[st.arr[P.i].id]='i';if(P.j!=null)tagIds[st.arr[P.j].id]='j';
    const selRow=(st.action==='Divide'||st.action==='Base case')?st.node:null;
    const justPlaced=(st.action==='Take'||st.action==='Move')&&prefix.length?prefix[prefix.length-1].id:null;
    for(const id of vis){
      const nd=nodes[id],sv=S_(id),items=sv==='3'?nd.sortedItems:sv==='2'?prefix:nd.orig;
      for(let k=0;k<nd.hi-nd.lo;k++){
        const it=items[k]||null,cls=[];
        if(!it)cls.push('empty');else if(sv==='3')cls.push('srt');else if(sv==='2')cls.push('mrg');
        if(it&&kids.has(id)&&used.has(it.id))cls.push('used');
        if(it&&kids.has(id)&&cmpIds.has(it.id))cls.push('cmp');
        if(selRow===id)cls.push('sel');
        if(it&&sv==='2'&&it.id===justPlaced)cls.push('new');
        let tag=null;
        if(it&&kids.has(id)&&!used.has(it.id)&&tagIds[it.id])tag=tagIds[it.id];
        if(st.action==='Divide'&&id===st.node&&P.mid-nd.lo===k)tag='mid';
        out.push({id,k,it,cls:cls.join(' '),tag});
      }
    }
    return out;
  }
  quickCells(st,nodes,vis,S_){
    const out=[],a=st.arr,P=st.ptr||{},tags={};
    for(const nm of Object.keys(P)){const x=P[nm];if(x==null)continue;tags[x]=tags[x]?tags[x]+', '+nm:nm;}
    for(const id of vis){
      const nd=nodes[id],sv=S_(id);
      for(let k=0;k<nd.hi-nd.lo;k++){
        const x=nd.lo+k,cls=[];let it;
        if(sv==='2'||sv==='3')it=a[x];
        else if(sv==='1'){
          if(x===nd.p){it=a[x];cls.push('fixed');}
          else{const kid=nd.kids.find(c=>x>=nodes[c].lo&&x<nodes[c].hi);
            if(kid!=null&&S_(kid)==='3'){it=a[x];cls.push('srt');}else it=nd.after[k];}
        }else it=nd.orig[k];
        if(sv==='3')cls.push('srt');
        if(id===st.node&&sv==='2'){
          if(st.part){const[lo,i,j]=st.part;if(x>=lo&&x<=i)cls.push('lt');else if(x>i&&x<j)cls.push('ge');}
          if(st.type==='compare'&&(x===st.i||x===st.j))cls.push('cmp');
          if(st.type==='swap'&&(x===st.i||x===st.j))cls.push('new');
          if(st.piv===x)cls.push('piv');
        }
        if(st.action==='Base case'&&id===st.node)cls.push('sel');
        out.push({id,k,it,cls:cls.join(' '),tag:id===st.node?(tags[x]||null):null});
      }
    }
    return out;
  }
  render(st,rec,instant){
    const nodes=rec.nodes;if(!nodes||this.stage.hidden)return;
    const quick=rec.kind==='quick',n=S.values.length,ns=st.ns||'',S_=id=>ns[id]||'0',D=Math.max(...nodes.map(x=>x.d));
    const gapsFor=d=>quick?[]:nodes.filter(x=>x.kids&&x.d<d).map(x=>nodes[x.kids[1]].lo).sort((p,q)=>p-q);
    const W=Math.max(200,this.stage.clientWidth-10),gD=gapsFor(D).length;
    const cw=Math.max(24,Math.min(48,Math.floor(W/(n+gD*0.6)))),gw=cw*0.6,rowH=cw+(cw<30?34:42);
    const Wc=Math.max(W,n*cw+gD*gw+8);
    this.c.style.height=((D+1)*rowH)+'px';this.c.style.width=Wc+'px';
    this.c.classList.toggle('tiny',cw<30);
    const cache={};
    const X=(k,d)=>{if(!cache[d]){const g=gapsFor(d);cache[d]={g,off:(Wc-(n*cw+g.length*gw))/2};}
      const f=cache[d];let c=0;for(const b of f.g)if(b<=k)c++;return f.off+k*cw+c*gw;};
    const vis=[];
    (function visit(id){vis.push(id);const nd=nodes[id],sv=S_(id);
      if(nd.kids&&nd.kids.length&&(quick?sv==='1':(sv==='1'||sv==='2')))nd.kids.forEach(visit);})(0);
    const list=quick?this.quickCells(st,nodes,vis,S_):this.mergeCells(st,nodes,vis,S_);
    const want=new Map(),wantF=new Map();
    for(const id of vis){const nd=nodes[id];
      wantF.set(id,{x:X(nd.lo,nd.d)-4,y:nd.d*rowH-4,w:(nd.hi-nd.lo)*cw+6,h:cw+6,cur:st.node===id&&st.type!=='done'});}
    for(const c of list){const nd=nodes[c.id];want.set(c.id+':'+c.k,Object.assign(c,{x:X(nd.lo+c.k,nd.d),y:nd.d*rowH,d:nd.d}));}
    const dur=instant?0:durMs(),next=new Map();
    for(const[key,el]of this.frames)if(!wantF.has(key)){el.remove();this.frames.delete(key);}
    for(const[key,f]of wantF){let el=this.frames.get(key);
      if(!el){el=document.createElement('div');this.c.appendChild(el);this.frames.set(key,el);}
      el.className='mframe'+(f.cur?' cur':'');el.style.left=f.x+'px';el.style.top=f.y+'px';el.style.width=f.w+'px';el.style.height=f.h+'px';}
    for(const[key,el]of this.cells)if(!want.has(key)){el.remove();this.cells.delete(key);}
    for(const[key,w]of want){
      let el=this.cells.get(key);const created=!el;
      if(!el){el=document.createElement('div');el.innerHTML='<b></b><small></small><em></em>';this.c.appendChild(el);this.cells.set(key,el);}
      const prevId=el.dataset.item||'',nowId=w.it?String(w.it.id):'';
      el.className='mcell '+w.cls;
      el.style.left=w.x+'px';el.style.top=w.y+'px';el.style.width=(cw-2)+'px';el.style.height=(cw-2)+'px';
      el.children[0].textContent=w.it?fmt(w.it.v):'';el.children[1].textContent=w.k;
      el.children[2].textContent=w.tag||'';el.children[2].className=w.tag?'on t-'+w.tag.split(',')[0].replace(/[^a-z].*$/,''):'';
      el.dataset.item=nowId;
      if(w.it)next.set(nowId+'@'+w.d,{x:w.x,y:w.y});
      if(!instant&&!RM&&w.it&&(created||prevId!==nowId)){
        const src=this.prev.get(nowId+'@'+(w.d+1))||this.prev.get(nowId+'@'+w.d)||this.prev.get(nowId+'@'+(w.d-1));
        if(src&&(src.x!==w.x||src.y!==w.y)){el.style.zIndex=4;el.animate([{transform:`translate(${src.x-w.x}px,${src.y-w.y}px)`},{transform:'translate(0,0)'}],{duration:Math.max(dur,280),easing:'cubic-bezier(.45,.05,.2,1)'});}
        else if(created)el.animate([{opacity:0},{opacity:1}],{duration:220});
      }
    }
    this.prev=next;
  }
}
const msView=new MSView($('#mStage'),$('#mCanvas'));
const MS_LEGENDS={
  merge:[['#fbe7a1','Selected'],['var(--cmp)','Comparing'],['var(--swp)','Just placed'],['var(--mrg)','Merged so far (temp[])'],['var(--srt)','Sorted subarray'],['dashed','Empty slot']],
  quick:[['var(--key)','Pivot'],['color-mix(in srgb,var(--runl) 40%,transparent)','Smaller than pivot'],['color-mix(in srgb,var(--runr) 40%,transparent)','Not smaller'],['var(--cmp)','Comparing'],['var(--swp)','Swapping'],['var(--srt)','Fixed / sorted']]
};
function applyViewVisibility(){
  const isS=S.mode==='single'&&(S.algo==='merge'||S.algo==='quick'),split=isS&&S.mview==='split';
  $('#mviewSeg').hidden=!isS;$('#mStage').hidden=!split;$('#mainStage').hidden=split;
  $('#idxRow').hidden=split;$('#ptrRow').hidden=split;$('#legend').hidden=split;$('#legendMS').hidden=!split;
  if(isS)$('#legendMS').innerHTML=MS_LEGENDS[S.algo].map(([c,t])=>c==='dashed'?`<span><i style="border:1.5px dashed var(--muted)"></i>${t}</span>`:`<span><i style="background:${c}"></i>${t}</span>`).join('');
}
if(window.ResizeObserver)new ResizeObserver(()=>{const p=S.players[0];if(!$('#mStage').hidden&&p&&p.rec.nodes)msView.render(p.steps[p.idx],p.rec,true);}).observe($('#mStage'));
function buildMinis(){
  const g=$('#miniGrid');g.innerHTML='';
  const order=ALGO_KEYS.slice().sort((a,b)=>S.records[a].steps.length-S.records[b].steps.length);
  minis=ALGO_KEYS.map(k=>{
    const A=ALGOS[k],card=document.createElement('div');card.className='mini';
    card.innerHTML=`<div class="mini-head"><span class="dot" style="background:${A.color}"></span><h3>${A.name}</h3><span class="badge" hidden>Finished #${order.indexOf(k)+1}</span></div>
      <div class="stage"><div class="plot"></div></div>
      <div class="ptrs"></div>
      <div class="mini-stats"><div><b class="m-c">0</b><span>comparisons</span></div><div><b class="m-w">0</b><span>${A.writeLbl.toLowerCase()}</span></div><div><b class="m-p">0</b><span>${(A.passLbl||'Passes').toLowerCase()}</span></div><div><b class="m-s">0</b><span>steps</span></div></div>
      <div class="mini-narr"></div>`;
    g.appendChild(card);const viz=new Viz(card.querySelector('.plot'),null,card.querySelector('.ptrs'));viz.load(S.items,true);
    return{card,viz,c:card.querySelector('.m-c'),w:card.querySelector('.m-w'),p:card.querySelector('.m-p'),s:card.querySelector('.m-s'),narr:card.querySelector('.mini-narr'),badge:card.querySelector('.badge')};
  });
}

/* ---------- Render ---------- */
function setStat(id,val){const el=$(id);const s=String(val);if(el.textContent!==s){el.textContent=s;el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}}
function showBanner(text){const b=$('#banner');const host=$('#mStage').hidden?$('#mainStage'):$('#mStage');if(b.parentNode!==host)host.appendChild(b);b.style.display=host.id==='mStage'?'none':'';b.textContent=text;b.classList.remove('show');void b.offsetWidth;b.classList.add('show');
  const st=host;st.classList.remove('flash');void st.offsetWidth;st.classList.add('flash');}
function passesDone(p){let c=0;for(const x of p.rec.passes)if(x.step<=p.idx)c++;return c;}

function renderAll(instant){
  document.documentElement.style.setProperty('--dur',(instant?0:durMs())+'ms');
  if(S.mode==='single')renderSingle(S.players[0],instant);
  else S.players.forEach((p,k)=>renderMini(p,minis[k],instant));
  const cur=Math.max(...S.players.map(p=>p.idx)),max=Math.max(...S.players.map(p=>p.steps.length-1));
  $('#scrub').value=cur;$('#readout').textContent=`${cur} / ${max} · ${(S.elapsed/1000).toFixed(1)}s`;
  updateButtons();
}
function renderSingle(p,instant){
  const st=p.steps[p.idx];
  mainViz.render(st,instant);mainViz.setDone(st.type==='done');
  $('#narr').innerHTML=`<span class="tag t-${st.type}">${actionLabel(st)}</span><span>${esc(st.msg)}</span>`;
  setStat('#sComp',st.comps);setStat('#sWrite',st.writes);setStat('#sPass',passesDone(p));
  setStat('#sCur',st.type==='done'||st.type==='start'?'—':st.pass);
  $('#sSteps').textContent=`${p.idx} / ${p.steps.length-1}`;$('#sTime').textContent=(S.elapsed/1000).toFixed(1)+'s';
  $('#sN').textContent=S.values.length;$('#sIdx').textContent=idxText(st);
  Array.from($('#code').children).forEach((li,k)=>li.classList.toggle('on',k===st.line));scrollCode(st.line);
  updatePassTable(p);highlightLog(p.idx);updateLiveChart(p);if((S.algo==='merge'||S.algo==='quick')&&S.mview==='split')msView.render(st,p.rec,instant);
  if(!instant&&(st.type==='pass'||st.type==='done'))showBanner(st.type==='done'?'Sorted':`${(w=>w[0].toUpperCase()+w.slice(1))(ALGOS[S.algo].passWord)} ${st.pass} complete`);
}
function renderMini(p,m,instant){
  const st=p.steps[p.idx];
  m.viz.render(st,instant);m.viz.setDone(st.type==='done');
  m.c.textContent=st.comps;m.w.textContent=st.writes;m.p.textContent=passesDone(p);m.s.textContent=`${p.idx}/${p.steps.length-1}`;
  m.narr.textContent=st.msg;m.badge.hidden=st.type!=='done';m.card.classList.toggle('finished',st.type==='done');
}

/* ---------- Playback ---------- */
function delayMs(){return Math.round(1000*Math.pow(0.68,S.speed-1));}
function durMs(){return Math.min(Math.round(delayMs()*0.85),420);}
const allDone=()=>S.players.every(p=>p.idx>=p.steps.length-1);
const anyStarted=()=>S.players.some(p=>p.idx>0);
function goStart(){S.players.forEach(p=>p.idx=0);S.elapsed=0;if(S.mode==='single')resetPassTable();}
function play(){if(!S.players.length)return;if(allDone())goStart();S.playing=true;S.lastT=performance.now();renderAll(true);schedule();}
function schedule(){clearTimeout(S.timer);S.timer=setTimeout(tick,delayMs());}
function tick(){
  if(!S.playing)return;const now=performance.now();S.elapsed+=now-S.lastT;S.lastT=now;
  S.players.forEach(p=>{if(p.idx<p.steps.length-1)p.idx++;});
  renderAll(false);
  if(allDone())stop();else schedule();
}
function stop(){if(S.playing)S.elapsed+=performance.now()-S.lastT;S.playing=false;clearTimeout(S.timer);updateButtons();}
function stepBy(d){stop();S.players.forEach(p=>{p.idx=Math.max(0,Math.min(p.steps.length-1,p.idx+d));});renderAll(false);}
function updateButtons(){
  const done=allDone(),started=anyStarted();
  $('#bStart').disabled=S.playing;$('#bStart').textContent=done&&started?'Replay':'Start';
  $('#bPause').disabled=!S.playing;
  $('#bResume').disabled=S.playing||!started||done;
  $('#bFwd').disabled=done;$('#bBack').disabled=!started;$('#bReset').disabled=!started&&!S.playing;
}

/* ---------- Tables ---------- */
function updateResults(){
  const rows=ALGO_KEYS.map(k=>{const r=S.records[k];return{k,c:r.comps,w:r.writes,p:r.pass,s:r.steps.length-1,ops:r.comps+r.writes,t:timeAlgo(k,S.values)};});
  const best=Math.min(...rows.map(r=>r.ops));
  const mins={c:Math.min(...rows.map(r=>r.c)),w:Math.min(...rows.map(r=>r.w)),p:Math.min(...rows.map(r=>r.p)),s:Math.min(...rows.map(r=>r.s)),t:Math.min(...rows.map(r=>r.t))};
  const B=(v,m,txt)=>v===m?`<b class="best">${txt}</b>`:txt;
  $('#resBody').innerHTML=rows.map(r=>`<tr class="${r.ops===best?'win':''}"><td><span class="dot" style="display:inline-block;background:${ALGOS[r.k].color};margin-right:8px"></span>${ALGOS[r.k].name}${r.ops===best?' (winner)':''}</td>
    <td class="mono">${B(r.c,mins.c,r.c)}</td><td class="mono">${B(r.w,mins.w,r.w)}</td><td class="mono">${B(r.p,mins.p,r.p+(r.k==='merge'||r.k==='quick'?' '+ALGOS[r.k].passLbl.toLowerCase():''))}</td><td class="mono">${B(r.s,mins.s,r.s)}</td><td class="mono"><b>${r.ops}</b></td><td class="mono">${B(r.t,mins.t,r.t.toFixed(2)+' µs')}</td></tr>`).join('');
}
function buildCx(){
  $('#cxBody').innerHTML=ALGO_KEYS.map(k=>{const c=ALGOS[k].cx;return `<tr data-k="${k}"><td>${ALGOS[k].name}</td><td class="mono">${c.best}</td><td class="mono">${c.avg}</td><td class="mono">${c.worst}</td><td class="mono">${c.space}</td><td>${c.stable}</td><td>${c.inplace}</td></tr>`;}).join('');
}
function renderTheory(){
  const A=ALGOS[S.algo];
  $('#vizTitle').textContent=A.name;$('#thTitle').textContent=`How ${A.name} works`;
  $('#thDesc').textContent=A.desc;$('#thHow').innerHTML=A.how.map(h=>`<li>${esc(h)}</li>`).join('');
  $('#thWhy').innerHTML=A.why.map(([h,t])=>`<div><b>${esc(h)}</b><p>${esc(t)}</p></div>`).join('');
  document.querySelectorAll('#cxBody tr').forEach(tr=>tr.classList.toggle('sel',tr.dataset.k===S.algo));
  refreshLegend();
}

/* ---------- Manual entry ---------- */
function buildManual(){
  const n=+$('#nNum').value,g=$('#manualGrid');g.innerHTML='';
  for(let k=0;k<n;k++){const v=S.values[k]!==undefined?fmt(S.values[k]):'';
    g.insertAdjacentHTML('beforeend',`<label>[${k}]<input type="text" inputmode="decimal" value="${v}" aria-label="Value at index ${k}"></label>`);}
}

/* ---------- Charts ---------- */
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function baseOpts(extra){
  return Object.assign({responsive:true,maintainAspectRatio:false,animation:{duration:250},
    plugins:{legend:{labels:{boxWidth:12,boxHeight:12}}},interaction:{mode:'nearest',intersect:false}},extra||{});
}
function initCharts(){
  if(!window.Chart){document.querySelectorAll('.chartbox').forEach(b=>b.innerHTML='<div class="nochart">Charts need an internet connection to load Chart.js.</div>');return;}
  Chart.defaults.font.family=cssVar('--sans')||'sans-serif';
  charts.live=new Chart($('#chLive'),{type:'line',data:{datasets:[
    {label:'Comparisons',data:[],borderColor:'#f2b705',backgroundColor:'#f2b705',pointRadius:0,borderWidth:2,tension:.15},
    {label:'Swaps / writes',data:[],borderColor:'#e5484d',backgroundColor:'#e5484d',pointRadius:0,borderWidth:2,tension:.15}]},
    options:baseOpts({animation:false,scales:{x:{type:'linear',min:0,title:{display:true,text:'Step'}},y:{beginAtZero:true,title:{display:true,text:'Cumulative count'}}}})});
  charts.cmp=new Chart($('#chCompare'),{type:'bar',data:{labels:ALGO_KEYS.map(k=>ALGOS[k].name),datasets:[
    {label:'Comparisons',data:[],backgroundColor:'#f2b705',borderRadius:4},{label:'Swaps / writes',data:[],backgroundColor:'#e5484d',borderRadius:4},{label:'Passes (merges / partitions)',data:[],backgroundColor:'#2f5bea',borderRadius:4}]},
    options:baseOpts({scales:{y:{beginAtZero:true}}})});
  const xs=Array.from({length:50},(_,i)=>i+1);
  charts.growth=new Chart($('#chGrowth'),{type:'line',data:{datasets:[
    {label:'O(n)',data:xs.map(n=>({x:n,y:n})),borderColor:'#18a871',backgroundColor:'#18a871',pointRadius:0,borderWidth:2},
    {label:'O(n log n)',data:xs.map(n=>({x:n,y:+(n*Math.log2(Math.max(n,1))).toFixed(2)})),borderColor:'#ef7d2d',backgroundColor:'#ef7d2d',pointRadius:0,borderWidth:2},
    {label:'O(n²)',data:xs.map(n=>({x:n,y:n*n})),borderColor:'#e5484d',backgroundColor:'#e5484d',pointRadius:0,borderWidth:2},
    {label:'Your n',type:'scatter',data:[],backgroundColor:'#2f5bea',borderColor:'#fff',pointRadius:6,borderWidth:2}]},
    options:baseOpts({scales:{x:{type:'linear',min:1,max:50,title:{display:true,text:'n (elements)'}},y:{beginAtZero:true,title:{display:true,text:'Operations'}}}})});
  charts.emp=new Chart($('#chEmp'),{type:'line',data:{labels:[],datasets:ALGO_KEYS.map(k=>({label:ALGOS[k].name,data:[],borderColor:ALGOS[k].color,backgroundColor:ALGOS[k].color,pointRadius:3,borderWidth:2,tension:.2}))},
    options:baseOpts({scales:{x:{title:{display:true,text:'n (random array)'}},y:{beginAtZero:true,title:{display:true,text:'Comparisons + writes'}}}})});
  restyleCharts();runEmpirical();
}
function restyleCharts(){
  if(!window.Chart)return;const t=cssVar('--muted'),g=cssVar('--line');
  Object.values(charts).forEach(ch=>{
    ch.options.plugins.legend.labels.color=t;
    Object.values(ch.options.scales).forEach(s=>{s.ticks=Object.assign(s.ticks||{},{color:t});s.grid=Object.assign(s.grid||{},{color:g});if(s.title)s.title.color=t;});
    ch.update('none');});
}
function resetLiveChart(){
  if(!charts.live)return;const p=S.players[0],L=p.steps.length,stride=Math.max(1,Math.ceil(L/300));
  S.livePts=[];for(let k=0;k<L;k+=stride)S.livePts.push(k);if(S.livePts[S.livePts.length-1]!==L-1)S.livePts.push(L-1);
  charts.live.options.scales.x.max=Math.max(1,L-1);
}
function updateLiveChart(p){
  if(!charts.live)return;const pts=S.livePts.filter(k=>k<=p.idx);if(pts[pts.length-1]!==p.idx)pts.push(p.idx);
  charts.live.data.datasets[0].data=pts.map(k=>({x:k,y:p.steps[k].comps}));
  charts.live.data.datasets[1].data=pts.map(k=>({x:k,y:p.steps[k].writes}));
  charts.live.update('none');
}
function updateCompareChart(){
  if(!charts.cmp)return;const R=ALGO_KEYS.map(k=>S.records[k]);
  charts.cmp.data.datasets[0].data=R.map(r=>r.comps);charts.cmp.data.datasets[1].data=R.map(r=>r.writes);charts.cmp.data.datasets[2].data=R.map(r=>r.pass);
  charts.cmp.update();
}
function updateGrowthChart(){
  if(!charts.growth)return;const n=S.values.length;
  charts.growth.data.datasets[3].data=[{x:n,y:n},{x:n,y:+(n*Math.log2(n)).toFixed(2)},{x:n,y:n*n}];charts.growth.update();
}
function runEmpirical(){
  if(!charts.emp)return;const sizes=[5,10,20,30,40,50];
  const data=ALGO_KEYS.map(()=>[]);
  sizes.forEach(n=>{const items=genValues(n,'random').map((v,id)=>({id,v}));ALGO_KEYS.forEach((k,i)=>{const r=ALGOS[k].run(items);data[i].push(r.comps+r.writes);});});
  charts.emp.data.labels=sizes;charts.emp.data.datasets.forEach((d,i)=>d.data=data[i]);charts.emp.update();
}

/* ---------- Theme ---------- */
function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  $('#themeBtn').textContent=t==='dark'?'Light mode':'Dark mode';
  try{localStorage.setItem('sortscope-theme',t);}catch(e){}
  restyleCharts();
}

/* ---------- Events ---------- */
function setN(n){n=Math.max(2,Math.min(50,Math.round(n)||2));showErr('');setValues(genValues(n,S.preset));}
$('#nRange').addEventListener('input',e=>{$('#nNum').value=e.target.value;setN(+e.target.value);});
$('#nNum').addEventListener('change',e=>setN(+e.target.value));
$('#presetSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  S.preset=b.dataset.p;document.querySelectorAll('#presetSeg button').forEach(x=>x.classList.toggle('on',x===b));setN(+$('#nNum').value);});
$('#modeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.dataset.mode===S.mode)return;
  S.mode=b.dataset.mode;document.querySelectorAll('#modeSeg button').forEach(x=>x.classList.toggle('on',x===b));
  $('#singleView').hidden=S.mode!=='single';applyViewVisibility();$('#compareView').hidden=S.mode!=='compare';
  document.querySelectorAll('[data-single]').forEach(el=>el.hidden=S.mode!=='single');
  refreshLegend();rebuild();});
$('#algoSel').addEventListener('change',e=>{S.algo=e.target.value;renderTheory();if(S.mode==='single')rebuild();});
function applyCustom(){const r=parseInput($('#customIn').value);if(r.error){showErr(r.error,$('#customIn'));return;}showErr('');setValues(r.vals);}
$('#applyBtn').addEventListener('click',applyCustom);
$('#customIn').addEventListener('keydown',e=>{if(e.key==='Enter')applyCustom();});
$('#manualBtn').addEventListener('click',()=>{const p=$('#manualPanel');p.hidden=!p.hidden;$('#manualBtn').setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)buildManual();});
$('#manualLoad').addEventListener('click',()=>{
  const ins=Array.from(document.querySelectorAll('#manualGrid input'));showErr('');
  const badIdx=ins.findIndex(i=>!/^\s*[-+]?(\d+\.?\d*|\.\d+)\s*$/.test(i.value));
  if(badIdx>=0){showErr(`Index ${badIdx} needs a number.`,ins[badIdx]);ins[badIdx].focus();return;}
  const v=ins.map(i=>Number(i.value));if(v.some(x=>Math.abs(x)>1e6)){showErr('Keep each value between −1,000,000 and 1,000,000.');return;}
  setValues(v);});
$('#bStart').addEventListener('click',()=>{goStart();play();});
$('#bPause').addEventListener('click',stop);
$('#bResume').addEventListener('click',play);
$('#bFwd').addEventListener('click',()=>stepBy(1));
$('#bBack').addEventListener('click',()=>stepBy(-1));
$('#bReset').addEventListener('click',()=>{stop();goStart();renderAll(true);});
$('#scrub').addEventListener('input',e=>{stop();const v=+e.target.value;S.players.forEach(p=>p.idx=Math.min(v,p.steps.length-1));renderAll(false);});
$('#speed').addEventListener('input',e=>{S.speed=+e.target.value;if(S.playing)schedule();});
$('#rerunEmp').addEventListener('click',runEmpirical);
$('#mviewSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.mview=b.dataset.v;
  document.querySelectorAll('#mviewSeg button').forEach(x=>x.classList.toggle('on',x===b));applyViewVisibility();msView.reset();renderAll(true);});
$('#themeBtn').addEventListener('click',()=>applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'));
document.addEventListener('keydown',e=>{
  if(e.target.closest('input,select,textarea'))return;
  if(e.key===' '){e.preventDefault();if(S.playing)stop();else play();}
  else if(e.key==='ArrowRight'){e.preventDefault();stepBy(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();stepBy(-1);}
});

/* ---------- Init ---------- */
let theme=null;try{theme=localStorage.getItem('sortscope-theme');}catch(e){}
if(!theme)theme=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
buildLegend($('#legend'));buildLegend($('#legend2'));buildCx();
initCharts();applyTheme(theme);renderTheory();
setValues(genValues(12,'random'));
})();
