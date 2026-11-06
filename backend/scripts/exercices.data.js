// backend/scripts/exercises.data.js
// Catalog de exerciții C++ pe programa de liceu (clasele IX–XII, informatică intensiv/neintensiv).
// Fiecare exercițiu are o soluție de referință; outputurile testelor se GENEREAZĂ prin
// compilarea soluției (vezi gen-exercises-seed.js), deci nu sunt scrise de mână.

const H = (cerinta, intrare, iesire, restrictii, exIn, exOut) =>
  `CERINȚĂ:\n${cerinta}\n\nDATE DE INTRARE:\n${intrare}\n\nDATE DE IEȘIRE:\n${iesire}\n\nRESTRICȚII:\n${restrictii}\n\nEXEMPLU:\nIntrare: ${exIn}\nIeșire: ${exOut}`;

module.exports = [
  // ───────────────────────── CAPITOLUL 1 · Structuri de bază ─────────────────────────
  {
    slug: 'suma-doua-numere', chapter: 'Structuri de bază', grade: 9, difficulty: 1, xp: 10,
    title: 'Suma a două numere',
    description: H('Se citesc două numere întregi. Afișați suma lor.', 'Pe o linie, numerele a și b.', 'Suma a + b.', '-10^9 ≤ a, b ≤ 10^9. Folosiți tipul long long.', '10 15', '25'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long a,b; cin>>a>>b; cout<<a+b; return 0; }`,
    inputs: ['10 15', '-7 3', '0 0', '1000000000 1000000000']
  },
  {
    slug: 'media-aritmetica', chapter: 'Structuri de bază', grade: 9, difficulty: 1, xp: 10,
    title: 'Media aritmetică',
    description: H('Se citesc trei numere naturale. Afișați media lor aritmetică cu exact 2 zecimale.', 'Pe o linie, numerele a, b și c.', 'Media aritmetică, cu 2 zecimale (folosiți fixed și setprecision).', '0 ≤ a, b, c ≤ 1000.', '5 6 8', '6.33'),
    solution: `#include <iostream>
#include <iomanip>
using namespace std;
int main(){ int a,b,c; cin>>a>>b>>c; cout<<fixed<<setprecision(2)<<(a+b+c)/3.0; return 0; }`,
    inputs: ['5 6 8', '0 0 0', '10 10 10', '1 2 4', '1000 999 998']
  },
  {
    slug: 'aria-dreptunghi-perimetru', chapter: 'Structuri de bază', grade: 9, difficulty: 1, xp: 10,
    title: 'Perimetru și arie',
    description: H('Se citesc lungimea și lățimea unui dreptunghi. Afișați perimetrul și aria, separate prin spațiu.', 'Două numere naturale L și l.', 'Perimetrul și aria, pe aceeași linie, separate prin spațiu.', '1 ≤ l ≤ L ≤ 10000.', '5 3', '16 15'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long L,l; cin>>L>>l; cout<<2*(L+l)<<" "<<L*l; return 0; }`,
    inputs: ['5 3', '1 1', '10000 10000', '7 2']
  },
  {
    slug: 'cat-si-rest', chapter: 'Structuri de bază', grade: 9, difficulty: 1, xp: 10,
    title: 'Câtul și restul împărțirii',
    description: H('Se citesc două numere naturale a și b (b > 0). Afișați câtul și restul împărțirii lui a la b.', 'Numerele a și b.', 'Câtul și restul, separate prin spațiu.', '0 ≤ a ≤ 10^9, 1 ≤ b ≤ 10^9.', '17 5', '3 2'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long a,b; cin>>a>>b; cout<<a/b<<" "<<a%b; return 0; }`,
    inputs: ['17 5', '0 7', '100 10', '999999999 2']
  },

  // ───────────────────────── CAPITOLUL 2 · Structuri alternative ─────────────────────────
  {
    slug: 'maximul-a-trei', chapter: 'Structuri alternative (if)', grade: 9, difficulty: 1, xp: 15,
    title: 'Maximul a trei numere',
    description: H('Se citesc trei numere întregi. Afișați cel mai mare dintre ele.', 'Numerele a, b, c.', 'Valoarea maximă.', '-10^9 ≤ a, b, c ≤ 10^9.', '4 9 2', '9'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long a,b,c; cin>>a>>b>>c; long long m=a; if(b>m)m=b; if(c>m)m=c; cout<<m; return 0; }`,
    inputs: ['4 9 2', '-5 -2 -9', '7 7 7', '1000000000 -1000000000 0']
  },
  {
    slug: 'an-bisect', chapter: 'Structuri alternative (if)', grade: 9, difficulty: 1, xp: 15,
    title: 'An bisect',
    description: H('Se citește un an. Afișați DA dacă anul este bisect, altfel NU.', 'Un număr natural an.', 'DA sau NU.', '1 ≤ an ≤ 9999. Un an este bisect dacă se împarte exact la 4, dar nu la 100, cu excepția anilor divizibili cu 400.', '2024', 'DA'),
    solution: `#include <iostream>
using namespace std;
int main(){ int a; cin>>a; bool b=(a%400==0)||(a%4==0&&a%100!=0); cout<<(b?"DA":"NU"); return 0; }`,
    inputs: ['2024', '1900', '2000', '2023', '1996', '2100']
  },
  {
    slug: 'ecuatie-grad-1', chapter: 'Structuri alternative (if)', grade: 9, difficulty: 2, xp: 20,
    title: 'Ecuația de gradul I',
    description: H('Se rezolvă ecuația a·x + b = 0, cu a și b numere întregi. Dacă ecuația are soluție unică, afișați valoarea lui x cu 2 zecimale. Dacă nu are nicio soluție, afișați IMPOSIBIL. Dacă are o infinitate de soluții, afișați INFINIT.', 'Numerele a și b.', 'x cu 2 zecimale, IMPOSIBIL sau INFINIT.', '-1000 ≤ a, b ≤ 1000.', '2 -5', '2.50'),
    solution: `#include <iostream>
#include <iomanip>
using namespace std;
int main(){ int a,b; cin>>a>>b;
 if(a==0){ if(b==0) cout<<"INFINIT"; else cout<<"IMPOSIBIL"; }
 else { double x=-(double)b/a; if(x==0) x=0; cout<<fixed<<setprecision(2)<<x; }
 return 0; }`,
    inputs: ['2 -5', '0 0', '0 7', '3 0', '-4 8', '7 1']
  },

  // ───────────────────────── CAPITOLUL 3 · Structuri repetitive ─────────────────────────
  {
    slug: 'suma-1-la-n', chapter: 'Structuri repetitive', grade: 9, difficulty: 1, xp: 15,
    title: 'Suma numerelor de la 1 la n',
    description: H('Se citește un număr natural n. Calculați suma 1 + 2 + … + n folosind o structură repetitivă.', 'Numărul n.', 'Suma cerută.', '1 ≤ n ≤ 100000.', '5', '15'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long n,s=0; cin>>n; for(long long i=1;i<=n;i++) s+=i; cout<<s; return 0; }`,
    inputs: ['5', '1', '100', '100000']
  },
  {
    slug: 'factorial', chapter: 'Structuri repetitive', grade: 9, difficulty: 1, xp: 15,
    title: 'Factorialul unui număr',
    description: H('Se citește un număr natural n. Afișați n! (produsul 1·2·…·n).', 'Numărul n.', 'Valoarea n!.', '0 ≤ n ≤ 20. Folosiți unsigned long long. Prin definiție, 0! = 1.', '5', '120'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n; cin>>n; unsigned long long f=1; for(int i=2;i<=n;i++) f*=i; cout<<f; return 0; }`,
    inputs: ['5', '0', '1', '12', '20']
  },
  {
    slug: 'numere-pare-1-n', chapter: 'Structuri repetitive', grade: 9, difficulty: 1, xp: 15,
    title: 'Numerele pare',
    description: H('Se citește un număr natural n. Afișați, în ordine crescătoare, separate prin spațiu, toate numerele pare din intervalul [1, n]. Dacă nu există niciunul, afișați 0.', 'Numărul n.', 'Numerele pare sau 0.', '1 ≤ n ≤ 1000.', '9', '2 4 6 8'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n; cin>>n; bool first=true; for(int i=2;i<=n;i+=2){ if(!first) cout<<" "; cout<<i; first=false; } if(first) cout<<0; return 0; }`,
    inputs: ['9', '1', '2', '10', '20']
  },
  {
    slug: 'cmmdc-euclid', chapter: 'Structuri repetitive', grade: 9, difficulty: 2, xp: 25,
    title: 'Cel mai mare divizor comun',
    description: H('Se citesc două numere naturale nenule a și b. Calculați cel mai mare divizor comun și cel mai mic multiplu comun al lor, folosind algoritmul lui Euclid.', 'Numerele a și b.', 'cmmdc și cmmmc, separate prin spațiu.', '1 ≤ a, b ≤ 10^6.', '12 18', '6 36'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long a,b; cin>>a>>b; long long x=a,y=b; while(y){ long long r=x%y; x=y; y=r; } cout<<x<<" "<<a/x*b; return 0; }`,
    inputs: ['12 18', '7 13', '100 100', '1000000 999999', '1 5']
  },

  // ───────────────────────── CAPITOLUL 4 · Cifrele unui număr ─────────────────────────
  {
    slug: 'suma-cifrelor', chapter: 'Cifrele unui număr', grade: 9, difficulty: 1, xp: 20,
    title: 'Suma cifrelor',
    description: H('Se citește un număr natural n. Afișați suma cifrelor sale.', 'Numărul n.', 'Suma cifrelor.', '0 ≤ n ≤ 10^18.', '1234', '10'),
    solution: `#include <iostream>
using namespace std;
int main(){ unsigned long long n; cin>>n; int s=0; while(n){ s+=n%10; n/=10; } cout<<s; return 0; }`,
    inputs: ['1234', '0', '9', '1000000000', '999999999999999999']
  },
  {
    slug: 'oglindit', chapter: 'Cifrele unui număr', grade: 9, difficulty: 2, xp: 25,
    title: 'Oglinditul unui număr',
    description: H('Se citește un număr natural n. Afișați oglinditul său (cifrele în ordine inversă). Zerourile de la sfârșitul lui n devin zerouri de început și nu se afișează.', 'Numărul n.', 'Oglinditul lui n.', '0 ≤ n ≤ 10^9.', '12305', '50321'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long n,o=0; cin>>n; while(n){ o=o*10+n%10; n/=10; } cout<<o; return 0; }`,
    inputs: ['12305', '0', '1200', '7', '123456789']
  },
  {
    slug: 'palindrom-numar', chapter: 'Cifrele unui număr', grade: 9, difficulty: 2, xp: 25,
    title: 'Număr palindrom',
    description: H('Un număr este palindrom dacă este egal cu oglinditul său. Se citește un număr natural n. Afișați DA dacă n este palindrom, altfel NU.', 'Numărul n.', 'DA sau NU.', '0 ≤ n ≤ 10^9.', '12321', 'DA'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long n,o=0,c; cin>>n; c=n; while(c){ o=o*10+c%10; c/=10; } cout<<(o==n?"DA":"NU"); return 0; }`,
    inputs: ['12321', '12345', '7', '0', '1221', '10']
  },

  // ───────────────────────── CAPITOLUL 5 · Divizori și numere prime ─────────────────────────
  {
    slug: 'numar-prim', chapter: 'Divizori și numere prime', grade: 9, difficulty: 2, xp: 25,
    title: 'Număr prim',
    description: H('Se citește un număr natural n. Afișați DA dacă este prim, altfel NU.', 'Numărul n.', 'DA sau NU.', '0 ≤ n ≤ 10^9. Verificarea trebuie să fie suficient de rapidă (divizori până la √n).', '17', 'DA'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long n; cin>>n; bool p = n>=2; for(long long d=2; d*d<=n && p; d++) if(n%d==0) p=false; cout<<(p?"DA":"NU"); return 0; }`,
    inputs: ['17', '1', '0', '2', '100', '999999937', '1000000000']
  },
  {
    slug: 'numar-divizori', chapter: 'Divizori și numere prime', grade: 9, difficulty: 2, xp: 25,
    title: 'Numărul de divizori',
    description: H('Se citește un număr natural n. Afișați câți divizori are (inclusiv 1 și n).', 'Numărul n.', 'Numărul de divizori.', '1 ≤ n ≤ 10^9.', '12', '6'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long n; cin>>n; int c=0; for(long long d=1; d*d<=n; d++) if(n%d==0){ c++; if(d!=n/d) c++; } cout<<c; return 0; }`,
    inputs: ['12', '1', '49', '97', '1000000000']
  },
  {
    slug: 'descompunere-factori', chapter: 'Divizori și numere prime', grade: 10, difficulty: 3, xp: 35,
    title: 'Descompunerea în factori primi',
    description: H('Se citește un număr natural n ≥ 2. Afișați descompunerea sa în factori primi, câte un factor pe linie, sub forma „p e" (factorul prim și exponentul), în ordine crescătoare a factorilor.', 'Numărul n.', 'Perechile „p e", câte una pe linie.', '2 ≤ n ≤ 10^12.', '360', '2 3\n3 2\n5 1'),
    solution: `#include <iostream>
using namespace std;
int main(){ long long n; cin>>n; for(long long d=2; d*d<=n; d++){ if(n%d==0){ int e=0; while(n%d==0){ n/=d; e++; } cout<<d<<" "<<e<<"\\n"; } } if(n>1) cout<<n<<" 1\\n"; return 0; }`,
    inputs: ['360', '2', '97', '1024', '600851475143', '999999999989']
  },

  // ───────────────────────── CAPITOLUL 6 · Vectori ─────────────────────────
  {
    slug: 'suma-elemente-vector', chapter: 'Vectori (tablouri unidimensionale)', grade: 9, difficulty: 1, xp: 20,
    title: 'Suma elementelor unui vector',
    description: H('Se citește un număr n, apoi n numere întregi. Afișați suma elementelor.', 'Pe prima linie n, pe a doua linie cele n elemente.', 'Suma elementelor.', '1 ≤ n ≤ 1000, |elemente| ≤ 10^6.', '4\n1 2 3 4', '10'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n; cin>>n; long long s=0; for(int i=0;i<n;i++){ long long x; cin>>x; s+=x; } cout<<s; return 0; }`,
    inputs: ['4\n1 2 3 4', '1\n-5', '5\n-1 -2 -3 -4 -5', '3\n1000000 1000000 1000000']
  },
  {
    slug: 'minim-maxim-vector', chapter: 'Vectori (tablouri unidimensionale)', grade: 9, difficulty: 2, xp: 25,
    title: 'Minimul și maximul',
    description: H('Se citește un vector cu n elemente întregi. Afișați valoarea minimă și valoarea maximă, separate prin spațiu, apoi pozițiile primei apariții ale fiecăreia (indexare de la 1), pe aceeași linie.', 'Pe prima linie n, pe a doua linie elementele.', 'min max poz_min poz_max.', '1 ≤ n ≤ 1000, |elemente| ≤ 10^9.', '5\n3 9 1 9 4', '1 9 3 2'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n; cin>>n; long long v[1005]; for(int i=1;i<=n;i++) cin>>v[i]; int pm=1,pM=1; for(int i=2;i<=n;i++){ if(v[i]<v[pm]) pm=i; if(v[i]>v[pM]) pM=i; } cout<<v[pm]<<" "<<v[pM]<<" "<<pm<<" "<<pM; return 0; }`,
    inputs: ['5\n3 9 1 9 4', '1\n7', '4\n-3 -3 -3 -3', '6\n10 -20 30 -40 50 -60']
  },
  {
    slug: 'sortare-vector', chapter: 'Vectori (tablouri unidimensionale)', grade: 10, difficulty: 2, xp: 30,
    title: 'Sortarea crescătoare',
    description: H('Se citește un vector cu n elemente întregi. Sortați-l crescător, fără a folosi funcția sort, și afișați-l (elementele separate prin spațiu).', 'Pe prima linie n, pe a doua linie elementele.', 'Vectorul sortat crescător.', '1 ≤ n ≤ 1000, |elemente| ≤ 10^9. Se recomandă sortarea prin selecție sau prin interschimbare.', '5\n4 2 9 1 7', '1 2 4 7 9'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n; cin>>n; long long v[1005]; for(int i=0;i<n;i++) cin>>v[i]; for(int i=0;i<n-1;i++) for(int j=i+1;j<n;j++) if(v[i]>v[j]){ long long t=v[i]; v[i]=v[j]; v[j]=t; } for(int i=0;i<n;i++){ if(i) cout<<" "; cout<<v[i]; } return 0; }`,
    inputs: ['5\n4 2 9 1 7', '1\n3', '6\n5 5 5 1 1 1', '5\n-1 -5 3 0 -2', '4\n1 2 3 4']
  },
  {
    slug: 'cautare-binara', chapter: 'Vectori (tablouri unidimensionale)', grade: 10, difficulty: 3, xp: 35,
    title: 'Căutare binară',
    description: H('Se dă un vector sortat strict crescător cu n elemente și q interogări. Pentru fiecare interogare x, afișați poziția lui x în vector (indexare de la 1) sau 0 dacă nu există. Folosiți căutarea binară.', 'Pe prima linie n, pe a doua linie vectorul, pe a treia linie q, pe a patra linie cele q valori x.', 'Pentru fiecare interogare, pe câte o linie, poziția sau 0.', '1 ≤ n, q ≤ 10^5, elemente în [-10^9, 10^9].', '5\n2 4 6 8 10\n3\n6 7 10', '3\n0\n5'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n,q; cin>>n; static long long v[100005]; for(int i=1;i<=n;i++) cin>>v[i]; cin>>q; while(q--){ long long x; cin>>x; int l=1,r=n,ans=0; while(l<=r){ int m=(l+r)/2; if(v[m]==x){ ans=m; break; } if(v[m]<x) l=m+1; else r=m-1; } cout<<ans<<"\\n"; } return 0; }`,
    inputs: ['5\n2 4 6 8 10\n3\n6 7 10', '1\n5\n2\n5 6', '6\n-10 -3 0 4 9 20\n4\n-10 20 1 0']
  },

  // ───────────────────────── CAPITOLUL 7 · Matrice ─────────────────────────
  {
    slug: 'suma-diagonala-principala', chapter: 'Matrice (tablouri bidimensionale)', grade: 10, difficulty: 2, xp: 30,
    title: 'Sumele pe diagonale',
    description: H('Se citește o matrice pătratică de dimensiune n. Afișați suma elementelor de pe diagonala principală și suma elementelor de pe diagonala secundară.', 'Pe prima linie n, apoi cele n linii ale matricei.', 'Cele două sume, separate prin spațiu.', '1 ≤ n ≤ 100, |elemente| ≤ 1000.', '3\n1 2 3\n4 5 6\n7 8 9', '15 15'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n; cin>>n; int a[105][105]; long long sp=0,ss=0; for(int i=1;i<=n;i++) for(int j=1;j<=n;j++){ cin>>a[i][j]; if(i==j) sp+=a[i][j]; if(i+j==n+1) ss+=a[i][j]; } cout<<sp<<" "<<ss; return 0; }`,
    inputs: ['3\n1 2 3\n4 5 6\n7 8 9', '1\n5', '2\n1 2\n3 4', '4\n1 0 0 2\n0 3 4 0\n0 5 6 0\n7 0 0 8']
  },
  {
    slug: 'transpusa-matrice', chapter: 'Matrice (tablouri bidimensionale)', grade: 10, difficulty: 2, xp: 30,
    title: 'Transpusa unei matrice',
    description: H('Se citește o matrice cu n linii și m coloane. Afișați transpusa ei (m linii și n coloane).', 'Pe prima linie n și m, apoi cele n linii ale matricei.', 'Transpusa, câte o linie pe rând, elementele separate prin spațiu.', '1 ≤ n, m ≤ 100.', '2 3\n1 2 3\n4 5 6', '1 4\n2 5\n3 6'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n,m; cin>>n>>m; int a[105][105]; for(int i=0;i<n;i++) for(int j=0;j<m;j++) cin>>a[i][j]; for(int j=0;j<m;j++){ for(int i=0;i<n;i++){ if(i) cout<<" "; cout<<a[i][j]; } cout<<"\\n"; } return 0; }`,
    inputs: ['2 3\n1 2 3\n4 5 6', '1 1\n9', '3 1\n1\n2\n3', '1 4\n7 8 9 10']
  },
  {
    slug: 'spirala-matrice', chapter: 'Matrice (tablouri bidimensionale)', grade: 10, difficulty: 3, xp: 40,
    title: 'Matrice în spirală',
    description: H('Se citește un număr n. Construiți și afișați matricea pătratică n × n care conține numerele 1, 2, …, n² așezate în spirală, pornind din colțul stânga-sus, în sens orar.', 'Numărul n.', 'Matricea, câte o linie pe rând, elementele separate prin spațiu.', '1 ≤ n ≤ 20.', '3', '1 2 3\n8 9 4\n7 6 5'),
    solution: `#include <iostream>
using namespace std;
int main(){ int n; cin>>n; int a[25][25]={}; int top=0,bot=n-1,l=0,r=n-1,k=1; while(top<=bot&&l<=r){ for(int j=l;j<=r;j++) a[top][j]=k++; top++; for(int i=top;i<=bot;i++) a[i][r]=k++; r--; if(top<=bot){ for(int j=r;j>=l;j--) a[bot][j]=k++; bot--; } if(l<=r){ for(int i=bot;i>=top;i--) a[i][l]=k++; l++; } } for(int i=0;i<n;i++){ for(int j=0;j<n;j++){ if(j) cout<<" "; cout<<a[i][j]; } cout<<"\\n"; } return 0; }`,
    inputs: ['3', '1', '2', '4', '5']
  },

  // ───────────────────────── CAPITOLUL 8 · Șiruri de caractere ─────────────────────────
  {
    slug: 'numar-vocale', chapter: 'Șiruri de caractere', grade: 10, difficulty: 1, xp: 20,
    title: 'Numărul de vocale',
    description: H('Se citește un cuvânt format din litere mici ale alfabetului englez. Afișați câte vocale (a, e, i, o, u) conține.', 'Un cuvânt.', 'Numărul de vocale.', 'Lungimea cuvântului este cel mult 255.', 'informatica', '5'),
    solution: `#include <iostream>
#include <string>
using namespace std;
int main(){ string s; cin>>s; int c=0; for(char ch: s) if(ch=='a'||ch=='e'||ch=='i'||ch=='o'||ch=='u') c++; cout<<c; return 0; }`,
    inputs: ['informatica', 'rhythm', 'aeiou', 'a', 'programare']
  },
  {
    slug: 'palindrom-cuvant', chapter: 'Șiruri de caractere', grade: 10, difficulty: 2, xp: 25,
    title: 'Cuvânt palindrom',
    description: H('Se citește un cuvânt format din litere mici. Afișați DA dacă este palindrom (se citește la fel de la stânga la dreapta și invers), altfel NU.', 'Un cuvânt.', 'DA sau NU.', 'Lungimea cuvântului este cel mult 255.', 'radar', 'DA'),
    solution: `#include <iostream>
#include <string>
using namespace std;
int main(){ string s; cin>>s; bool p=true; for(size_t i=0,j=s.size();i<j/2;i++) if(s[i]!=s[j-1-i]) p=false; cout<<(p?"DA":"NU"); return 0; }`,
    inputs: ['radar', 'abc', 'a', 'abba', 'abca']
  },
  {
    slug: 'frecventa-litere', chapter: 'Șiruri de caractere', grade: 10, difficulty: 2, xp: 30,
    title: 'Frecvența literelor',
    description: H('Se citește un text format din litere mici (fără spații). Afișați, în ordine alfabetică, fiecare literă care apare în text, urmată de numărul de apariții, sub forma „litera frecvență", câte una pe linie.', 'Un cuvânt.', 'Perechile „litera frecvență", câte una pe linie, doar pentru literele care apar.', 'Lungimea textului este cel mult 255.', 'banana', 'a 3\nb 1\nn 2'),
    solution: `#include <iostream>
#include <string>
using namespace std;
int main(){ string s; cin>>s; int f[26]={}; for(char c: s) f[c-'a']++; for(int i=0;i<26;i++) if(f[i]) cout<<(char)('a'+i)<<" "<<f[i]<<"\\n"; return 0; }`,
    inputs: ['banana', 'a', 'zzz', 'informatica']
  },

  // ───────────────────────── CAPITOLUL 9 · Subprograme ─────────────────────────
  {
    slug: 'functie-cmmdc', chapter: 'Subprograme (funcții)', grade: 10, difficulty: 2, xp: 30,
    title: 'Funcție: cmmdc pe un șir',
    description: H('Scrieți o funcție int cmmdc(int a, int b) și folosiți-o pentru a calcula cel mai mare divizor comun al celor n numere citite.', 'Pe prima linie n, pe a doua linie cele n numere.', 'cmmdc-ul tuturor numerelor.', '1 ≤ n ≤ 1000, 1 ≤ elemente ≤ 10^9.', '3\n12 18 30', '6'),
    solution: `#include <iostream>
using namespace std;
int cmmdc(int a,int b){ while(b){ int r=a%b; a=b; b=r; } return a; }
int main(){ int n; cin>>n; int g=0; for(int i=0;i<n;i++){ int x; cin>>x; g=cmmdc(g,x); } cout<<g; return 0; }`,
    inputs: ['3\n12 18 30', '1\n7', '4\n7 11 13 17', '3\n1000000000 500000000 250000000']
  },
  {
    slug: 'functie-prim-interval', chapter: 'Subprograme (funcții)', grade: 10, difficulty: 2, xp: 30,
    title: 'Numerele prime dintr-un interval',
    description: H('Scrieți o funcție bool estePrim(int x). Se citesc a și b; afișați numărul de numere prime din intervalul [a, b] și apoi pe cele din interval, separate prin spațiu (pe linia următoare). Dacă nu există, afișați doar 0.', 'Numerele a și b.', 'Prima linie: numărul de prime. A doua linie: primele (doar dacă există).', '1 ≤ a ≤ b ≤ 10000.', '10 20', '4\n11 13 17 19'),
    solution: `#include <iostream>
#include <vector>
using namespace std;
bool estePrim(int x){ if(x<2) return false; for(int d=2; d*d<=x; d++) if(x%d==0) return false; return true; }
int main(){ int a,b; cin>>a>>b; vector<int> p; for(int i=a;i<=b;i++) if(estePrim(i)) p.push_back(i); cout<<p.size(); if(!p.empty()){ cout<<"\\n"; for(size_t i=0;i<p.size();i++){ if(i) cout<<" "; cout<<p[i]; } } return 0; }`,
    inputs: ['10 20', '1 1', '2 2', '1 100', '9990 10000']
  },

  // ───────────────────────── CAPITOLUL 10 · Recursivitate ─────────────────────────
  {
    slug: 'fibonacci-recursiv', chapter: 'Recursivitate', grade: 11, difficulty: 2, xp: 30,
    title: 'Șirul lui Fibonacci',
    description: H('Șirul lui Fibonacci este definit astfel: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2). Se citește n. Afișați F(n), folosind o funcție recursivă sau iterativă.', 'Numărul n.', 'F(n).', '0 ≤ n ≤ 40.', '10', '55'),
    solution: `#include <iostream>
using namespace std;
long long F(int n){ if(n<2) return n; return F(n-1)+F(n-2); }
int main(){ int n; cin>>n; cout<<F(n); return 0; }`,
    inputs: ['10', '0', '1', '2', '30', '40']
  },
  {
    slug: 'putere-recursiv', chapter: 'Recursivitate', grade: 11, difficulty: 3, xp: 40,
    title: 'Ridicare la putere rapidă',
    description: H('Se citesc a, b și m. Calculați a^b mod m, folosind ridicarea la putere în timp logaritmic (prin recursivitate sau iterativ).', 'Numerele a, b, m.', 'Valoarea a^b mod m.', '0 ≤ a ≤ 10^9, 0 ≤ b ≤ 10^18, 1 ≤ m ≤ 10^9.', '2 10 1000', '24'),
    solution: `#include <iostream>
using namespace std;
long long p(long long a,long long b,long long m){ if(b==0) return 1%m; long long h=p(a,b/2,m); h=h*h%m; if(b%2) h=h*(a%m)%m; return h; }
int main(){ long long a,b,m; cin>>a>>b>>m; cout<<p(a,b,m); return 0; }`,
    inputs: ['2 10 1000', '3 0 7', '5 3 1', '2 1000000000000000000 1000000007', '0 5 13']
  },
  {
    slug: 'permutari-backtracking', chapter: 'Recursivitate', grade: 11, difficulty: 3, xp: 45,
    title: 'Generarea permutărilor',
    description: H('Se citește n. Afișați toate permutările mulțimii {1, 2, …, n} în ordine lexicografică, câte una pe linie, elementele separate prin spațiu.', 'Numărul n.', 'Permutările, în ordine lexicografică.', '1 ≤ n ≤ 7.', '3', '1 2 3\n1 3 2\n2 1 3\n2 3 1\n3 1 2\n3 2 1'),
    solution: `#include <iostream>
using namespace std;
int n, x[10]; bool used[10];
void bk(int k){ if(k==n+1){ for(int i=1;i<=n;i++){ if(i>1) cout<<" "; cout<<x[i]; } cout<<"\\n"; return; } for(int v=1;v<=n;v++) if(!used[v]){ used[v]=true; x[k]=v; bk(k+1); used[v]=false; } }
int main(){ cin>>n; bk(1); return 0; }`,
    inputs: ['3', '1', '2', '4']
  },

  // ───────────────────────── CAPITOLUL 11 · Structuri și sortări ─────────────────────────
  {
    slug: 'sortare-elevi-struct', chapter: 'Structuri de date (struct)', grade: 11, difficulty: 3, xp: 40,
    title: 'Clasamentul elevilor',
    description: H('Se citesc datele a n elevi: nume (un cuvânt) și media (număr real). Afișați elevii în ordinea descrescătoare a mediei; la medii egale, în ordine alfabetică după nume. Fiecare elev se afișează pe o linie, sub forma „nume media" (media cu 2 zecimale).', 'Pe prima linie n, apoi n linii cu „nume media".', 'Clasamentul, câte un elev pe linie.', '1 ≤ n ≤ 100. Folosiți un struct și funcția sort cu o funcție de comparare.', '3\nIon 9.50\nAna 9.50\nMihai 8.75', 'Ana 9.50\nIon 9.50\nMihai 8.75'),
    solution: `#include <iostream>
#include <iomanip>
#include <algorithm>
#include <string>
using namespace std;
struct Elev{ string nume; double media; };
bool cmp(const Elev&a,const Elev&b){ if(a.media!=b.media) return a.media>b.media; return a.nume<b.nume; }
int main(){ int n; cin>>n; Elev e[105]; for(int i=0;i<n;i++) cin>>e[i].nume>>e[i].media; sort(e,e+n,cmp); cout<<fixed<<setprecision(2); for(int i=0;i<n;i++) cout<<e[i].nume<<" "<<e[i].media<<"\\n"; return 0; }`,
    inputs: ['3\nIon 9.50\nAna 9.50\nMihai 8.75', '1\nElena 10', '4\nZed 5\nAlex 5\nBob 7.25\nCris 10']
  }
];
