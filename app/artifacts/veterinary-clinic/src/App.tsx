import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity, AlertCircle, ArrowRight, CalendarDays, Check, ChevronRight, ClipboardList,
  Dog, FileText, Heart, LayoutDashboard, Menu, PawPrint, Phone, Plus, Search,
  Stethoscope, Trash2, UserRound, Users, X, Pencil, Mail, MapPin, Cat,
  CircleCheck, Info
} from 'lucide-react';

type Owner = { id: number; name: string; phone: string; email: string; address: string };
type Animal = { id: number; name: string; species: string; breed: string; birthDate: string; sex: string; ownerId: number };
type Doctor = { id: number; name: string; specialty: string; phone: string };
type Appointment = { id: number; animalId: number; doctorId: number; date: string; time: string; reason: string; status: string; diagnosis: string; treatment: string; recommendations: string };
type ClinicData = { owners: Owner[]; animals: Animal[]; doctors: Doctor[]; appointments: Appointment[] };
type ModalState = { type: 'owner' | 'animal' | 'appointment'; item?: Owner | Animal | Appointment } | null;

const STORAGE_KEY = 'vet-clinic-data-v1';
const dateOffset = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const makeDemo = (): ClinicData => ({
  owners: [
    { id: 1, name: 'Анна Крылова', phone: '+7 (916) 248-51-30', email: 'anna.krylova@mail.ru', address: 'Москва, ул. Новая, 14' },
    { id: 2, name: 'Дмитрий Орлов', phone: '+7 (903) 712-06-48', email: 'd.orlov@mail.ru', address: 'Москва, пр-т Мира, 82' },
    { id: 3, name: 'Мария Соколова', phone: '+7 (926) 350-41-92', email: 'm.sokolova@mail.ru', address: 'Москва, ул. Лесная, 7' },
    { id: 4, name: 'Илья и Ольга Волковы', phone: '+7 (925) 633-10-24', email: 'volkov.family@mail.ru', address: 'Москва, ул. Тихая, 21' },
    { id: 5, name: 'Елена Морозова', phone: '+7 (916) 504-28-16', email: 'e.morozova@mail.ru', address: 'Москва, ул. Садовая, 3' },
  ],
  animals: [
    { id: 1, name: 'Луна', species: 'Кошка', breed: 'Британская короткошёрстная', birthDate: '2021-05-14', sex: 'Самка', ownerId: 1 },
    { id: 2, name: 'Бакс', species: 'Собака', breed: 'Корги', birthDate: '2020-11-02', sex: 'Самец', ownerId: 2 },
    { id: 3, name: 'Плюша', species: 'Кошка', breed: 'Домашняя', birthDate: '2019-08-21', sex: 'Самка', ownerId: 3 },
    { id: 4, name: 'Ричи', species: 'Собака', breed: 'Шпиц', birthDate: '2022-02-07', sex: 'Самец', ownerId: 4 },
    { id: 5, name: 'Тим', species: 'Кролик', breed: 'Карликовый', birthDate: '2023-04-19', sex: 'Самец', ownerId: 5 },
    { id: 6, name: 'Марта', species: 'Собака', breed: 'Метис', birthDate: '2018-09-30', sex: 'Самка', ownerId: 1 },
  ],
  doctors: [
    { id: 1, name: 'Екатерина Лебедева', specialty: 'Терапевт', phone: '+7 (495) 201-16-40' },
    { id: 2, name: 'Артём Васильев', specialty: 'Хирург', phone: '+7 (495) 201-16-41' },
    { id: 3, name: 'Ольга Миронова', specialty: 'Дерматолог', phone: '+7 (495) 201-16-42' },
    { id: 4, name: 'Никита Смирнов', specialty: 'Стоматолог', phone: '+7 (495) 201-16-43' },
  ],
  appointments: [
    { id: 1, animalId: 1, doctorId: 1, date: dateOffset(0), time: '10:30', reason: 'Плановый осмотр', status: 'Запланирован', diagnosis: '', treatment: '', recommendations: '' },
    { id: 2, animalId: 2, doctorId: 2, date: dateOffset(0), time: '12:00', reason: 'Хромота после прогулки', status: 'Запланирован', diagnosis: '', treatment: '', recommendations: '' },
    { id: 3, animalId: 3, doctorId: 3, date: dateOffset(1), time: '09:30', reason: 'Зуд и покраснение кожи', status: 'Запланирован', diagnosis: '', treatment: '', recommendations: '' },
    { id: 4, animalId: 4, doctorId: 1, date: dateOffset(2), time: '15:00', reason: 'Вакцинация', status: 'Запланирован', diagnosis: '', treatment: '', recommendations: '' },
    { id: 5, animalId: 5, doctorId: 1, date: dateOffset(-2), time: '11:00', reason: 'Снижение аппетита', status: 'Завершён', diagnosis: 'Смена корма', treatment: 'Коррекция рациона', recommendations: 'Постепенно переводить на новый корм в течение недели.' },
  ],
});

const navigation = [
  { href: '/', label: 'Главная', icon: LayoutDashboard },
  { href: '/owners', label: 'Владельцы', icon: Users },
  { href: '/animals', label: 'Животные', icon: PawPrint },
  { href: '/appointments', label: 'Приёмы', icon: CalendarDays },
  { href: '/doctors', label: 'Врачи', icon: Stethoscope },
];
const fmtDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
const nextId = (list: {id:number}[]) => Math.max(0, ...list.map(x => x.id)) + 1;
const isUpcomingAppointment = (appointment: Appointment) =>
  appointment.status === 'Запланирован' &&
  new Date(`${appointment.date}T${appointment.time}`).getTime() >= Date.now();

function App() {
  const [location, setLocation] = useLocation();
  const [data, setData] = useState<ClinicData>(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? { ...makeDemo(), ...JSON.parse(saved) } : makeDemo(); }
    catch { return makeDemo(); }
  });
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 3600); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => setQuery(''), [location]);
  const notify = (message: string) => setToast(message);
  const counts = { owners: data.owners.length, animals: data.animals.length, appointments: data.appointments.filter(isUpcomingAppointment).length };
  const currentTitle = navigation.find(n => n.href === location)?.label ?? 'Страница не найдена';
  const mainView = location === '/' ? <Dashboard data={data} setLocation={setLocation} onAdd={() => setModal({type:'appointment'})} onAddOwner={() => setModal({type:'owner'})} onAddAnimal={() => setModal({type:'animal'})} /> :
    location === '/owners' ? <OwnersPage data={data} query={query} onQuery={setQuery} onAdd={() => setModal({type:'owner'})} onEdit={(x) => setModal({type:'owner',item:x})} onDelete={(x) => {
      if (data.animals.some(a => a.ownerId === x.id)) return notify('Сначала переназначьте питомцев этого владельца или удалите их карточки.');
      if (window.confirm(`Удалить владельца «${x.name}»?`)) setData(d => ({...d, owners:d.owners.filter(y=>y.id!==x.id)}));
    }} /> :
    location === '/animals' ? <AnimalsPage data={data} query={query} onQuery={setQuery} onAdd={() => setModal({type:'animal'})} onEdit={x => setModal({type:'animal',item:x})} onDelete={x => {
      if (data.appointments.some(a => a.animalId === x.id)) return notify('Нельзя удалить питомца: у него есть записи на приём. Сначала удалите или завершите записи.');
      if (window.confirm(`Удалить карточку питомца «${x.name}»?`)) setData(d => ({...d, animals:d.animals.filter(y=>y.id!==x.id)}));
    }} /> :
    location === '/appointments' ? <AppointmentsPage data={data} query={query} onQuery={setQuery} onAdd={() => setModal({type:'appointment'})} onEdit={x => setModal({type:'appointment',item:x})} onDelete={x => {
      if (window.confirm(`Удалить запись на приём ${fmtDate(x.date)} в ${x.time}?`)) setData(d => ({...d, appointments:d.appointments.filter(y=>y.id!==x.id)}));
    }} onStatus={(a,status) => setData(d=>({...d,appointments:d.appointments.map(x=>x.id===a.id?{...x,status}:x)}))} /> :
    location === '/doctors' ? <DoctorsPage doctors={data.doctors} /> : <NotFound goHome={() => setLocation('/')} />;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = Object.fromEntries(form.entries()) as Record<string,string>;
    if (modal?.type === 'owner') {
      if (!value.name?.trim() || !value.phone?.trim()) return notify('Укажите имя владельца и номер телефона.');
      const record: Owner = { id: (modal.item as Owner | undefined)?.id ?? nextId(data.owners), name:value.name.trim(), phone:value.phone.trim(), email:value.email.trim(), address:value.address.trim() };
      setData(d => ({...d,owners: modal.item ? d.owners.map(x=>x.id===record.id?record:x) : [record,...d.owners]}));
      notify(modal.item ? 'Карточка владельца обновлена.' : 'Владелец добавлен в картотеку.');
    } else if (modal?.type === 'animal') {
      if (!value.name?.trim() || !value.species || !value.ownerId) return notify('Заполните кличку, вид и выберите владельца.');
      const record: Animal = { id:(modal.item as Animal | undefined)?.id ?? nextId(data.animals), name:value.name.trim(), species:value.species, breed:value.breed.trim(), birthDate:value.birthDate, sex:value.sex || 'Не указан', ownerId:Number(value.ownerId) };
      setData(d=>({...d,animals:modal.item?d.animals.map(x=>x.id===record.id?record:x):[record,...d.animals]}));
      notify(modal.item ? 'Карточка питомца обновлена.' : 'Питомец добавлен в картотеку.');
    } else if (modal?.type === 'appointment') {
      if (!value.animalId || !value.doctorId || !value.date || !value.time || !value.reason?.trim()) return notify('Заполните питомца, врача, дату, время и причину визита.');
      const editing = modal.item as Appointment | undefined;
      const clash = data.appointments.some(a => a.id !== editing?.id && a.doctorId === Number(value.doctorId) && a.date === value.date && a.time === value.time);
      if (clash) return notify('У этого врача уже есть приём на выбранные дату и время.');
      const record: Appointment = { id:editing?.id ?? nextId(data.appointments), animalId:Number(value.animalId), doctorId:Number(value.doctorId), date:value.date, time:value.time, reason:value.reason.trim(), status:value.status || 'Запланирован', diagnosis:value.diagnosis.trim(), treatment:value.treatment.trim(), recommendations:value.recommendations.trim() };
      setData(d=>({...d,appointments:editing?d.appointments.map(x=>x.id===record.id?record:x):[record,...d.appointments]}));
      notify(editing ? 'Приём и его итоги обновлены.' : 'Запись на приём создана.');
    }
    setModal(null);
  };
  const modalHeading = modal ? `${modal.item ? 'Изменить' : 'Добавить'} ${modal.type==='owner'?'владельца':modal.type==='animal'?'питомца':'приём'}` : '';
  return (
    <div className="app-shell" style={{display:'flex'}}>
      <aside className="sidebar desktop-sidebar" style={{width:252, flexShrink:0, padding:'25px 17px', display:'flex', flexDirection:'column', minHeight:'100dvh', position:'sticky', top:0, height:'100dvh'}}>
        <Link href="/" className="brand" style={{display:'flex',alignItems:'center',gap:12,padding:'2px 10px 29px',color:'inherit',textDecoration:'none'}} data-testid="link-brand">
          <div style={{width:40,height:40,borderRadius:13,background:'#e4bd75',color:'#244b43',display:'grid',placeItems:'center'}}><PawPrint size={23}/></div>
          <div><div className="font-display" style={{fontSize:18,fontWeight:800,letterSpacing:'-.04em'}}>Лапа рядом</div><div style={{fontSize:10,letterSpacing:'.13em',textTransform:'uppercase',color:'#acc4b8',marginTop:2}}>Ветеринарная клиника</div></div>
        </Link>
        <div style={{fontSize:10,fontWeight:700,color:'#91afa2',letterSpacing:'.14em',textTransform:'uppercase',padding:'0 13px 10px'}}>Рабочее пространство</div>
        <nav style={{display:'grid',gap:4}}>{navigation.map(({href,label,icon:Icon}) => <Link key={href} href={href} data-testid={`nav-${href==='/'?'overview':href.slice(1)}`} className={`nav-link ${location===href?'active':''}`}><Icon size={18}/><span>{label}</span>{href==='/appointments'&&counts.appointments>0&&<span style={{marginLeft:'auto',fontSize:11,color:'#e7bd72'}}>{counts.appointments}</span>}</Link>)}</nav>
        <div style={{marginTop:'auto',padding:'14px 13px',borderRadius:14,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{display:'flex',gap:9,alignItems:'center',fontSize:12,fontWeight:700}}><span style={{width:8,height:8,borderRadius:'50%',background:'#8ac3a2'}}/>Клиника открыта</div>
          <div style={{fontSize:11,color:'#b8cdc3',marginTop:8,lineHeight:1.6}}>Ежедневно · 09:00–21:00<br/>+7 (495) 201-16-40</div>
        </div>
        <div style={{fontSize:10,color:'#8eaaa0',padding:'16px 12px 0'}}>Версия для сотрудников · 1.0</div>
      </aside>
      <div className="main-area" style={{flex:1,display:'flex',flexDirection:'column',minHeight:'100dvh'}}>
        <header style={{height:72,background:'rgba(255,254,250,.84)',borderBottom:'1px solid #e9e4d9',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(18px,4vw,52px)',position:'sticky',top:0,zIndex:10,backdropFilter:'blur(12px)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}><button className="menu-button" aria-label="Открыть меню" onClick={()=>setMobileMenu(v=>!v)} data-testid="button-mobile-menu" style={{display:'none',border:0,background:'transparent',color:'#315d54'}}><Menu size={21}/></button><div style={{fontSize:13,color:'#7b827b'}}>Клиника <ChevronRight size={13} style={{verticalAlign:'middle',margin:'0 5px'}}/><strong style={{color:'#304841',fontWeight:600}}>{currentTitle}</strong></div></div>
          <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:12,color:'#78837d'}}>{new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</span><div style={{width:34,height:34,borderRadius:12,display:'grid',placeItems:'center',background:'#edf3ed',color:'#477763'}}><Heart size={17}/></div></div>
        </header>
        {mobileMenu&&<div className="mobile-menu-popover" style={{display:'none',position:'fixed',zIndex:30,top:72,left:12,right:12,background:'#234a43',padding:12,borderRadius:16,boxShadow:'0 16px 40px #1b433733',flexDirection:'column'}}>{navigation.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setMobileMenu(false)} className={`nav-link ${location===href?'active':''}`}><Icon size={18}/>{label}</Link>)}</div>}
        <main className="main-content" style={{padding:'34px clamp(18px,4vw,52px) 58px',width:'100%',maxWidth:1440,margin:'0 auto',flex:1}}><div className="page-enter" key={location}>{mainView}</div></main>
        <div className="mobile-nav" style={{display:'none',position:'fixed',bottom:0,left:0,right:0,zIndex:25,background:'#fffefa',borderTop:'1px solid #e9e4d9',padding:'7px 6px calc(7px + env(safe-area-inset-bottom))',justifyContent:'space-around',boxShadow:'0 -6px 20px rgba(33,57,48,.06)'}}>
          {navigation.map(({href,label,icon:Icon})=><Link key={href} href={href} data-testid={`mobile-nav-${href==='/'?'overview':href.slice(1)}`} style={{display:'grid',justifyItems:'center',gap:3,minWidth:54,textDecoration:'none',fontSize:10,color:location===href?'#2c6858':'#8a968f',fontWeight:location===href?700:500}}><Icon size={19}/>{label}</Link>)}
        </div>
      </div>
      {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="modal-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'23px 25px 16px',borderBottom:'1px solid #eee9df'}}><div><div style={{fontSize:11,color:'#789083',textTransform:'uppercase',letterSpacing:'.12em',fontWeight:700}}>Картотека клиники</div><h2 id="modal-title" className="font-display" style={{fontSize:23,margin:'5px 0 0',letterSpacing:'-.04em'}}>{modalHeading}</h2></div><button className="action-icon" onClick={()=>setModal(null)} aria-label="Закрыть" data-testid="button-close-modal"><X size={19}/></button></div>
        <form onSubmit={submit} style={{padding:'20px 25px 24px'}}>
          {modal.type==='owner'&&<OwnerForm item={modal.item as Owner|undefined}/>}
          {modal.type==='animal'&&<AnimalForm item={modal.item as Animal|undefined} owners={data.owners}/>}
          {modal.type==='appointment'&&<AppointmentForm item={modal.item as Appointment|undefined} data={data}/>}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:22,paddingTop:17,borderTop:'1px solid #eee9df'}}><button type="button" onClick={()=>setModal(null)} className="button-secondary" data-testid="button-cancel">Отмена</button><button type="submit" className="button-primary" data-testid="button-save"><Check size={16}/>{modal.item?'Сохранить изменения':'Добавить'}</button></div>
        </form>
      </section></div>}
      {toast&&<div role="status" className="toast" data-testid="status-toast" style={{position:'fixed',zIndex:80,bottom:22,right:22,maxWidth:'min(420px,calc(100vw - 32px))',padding:'14px 16px',borderRadius:13,background:'#244b43',color:'#fffdf6',display:'flex',gap:10,alignItems:'flex-start',boxShadow:'0 12px 32px #1b433733',fontSize:13,lineHeight:1.5}}><Info size={17} style={{flexShrink:0,marginTop:1,color:'#e5be7a'}}/>{toast}<button onClick={()=>setToast('')} aria-label="Закрыть сообщение" style={{marginLeft:4,background:'transparent',border:0,color:'#c9d8d0'}}><X size={16}/></button></div>}
    </div>
  );
}

function PageHeading({eyebrow,title,description,action}: {eyebrow:string;title:string;description:string;action?:ReactNode}) {
  return <div className="page-header" style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:18,marginBottom:27}}><div><div style={{fontSize:11,letterSpacing:'.14em',fontWeight:700,textTransform:'uppercase',color:'#718b7e'}}>{eyebrow}</div><h1 className="font-display" style={{fontSize:'clamp(27px,3.3vw,38px)',lineHeight:1.12,letterSpacing:'-.05em',margin:'8px 0 7px',fontWeight:800}}>{title}</h1><p style={{fontSize:14,color:'#7d8780',margin:0}}>{description}</p></div>{action&&<div className="page-header-actions">{action}</div>}</div>;
}
function Button({children,onClick,testId,secondary=false,type='button'}:{children:ReactNode;onClick?:()=>void;testId:string;secondary?:boolean;type?:'button'|'submit'}) {
  return <button type={type} onClick={onClick} data-testid={testId} className={secondary?'button-secondary':'button-primary'}>{children}</button>;
}
function SearchBox({value,onChange,placeholder}:{value:string;onChange:(x:string)=>void;placeholder:string}) {
  return <label style={{position:'relative',display:'block',width:'min(100%,310px)'}}><Search size={16} style={{position:'absolute',left:12,top:13,color:'#8c9990'}}/><input data-testid="input-search" className="input-field" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{paddingLeft:37}}/></label>;
}
function Dashboard({data,setLocation,onAdd,onAddOwner,onAddAnimal}:{data:ClinicData;setLocation:(x:string)=>void;onAdd:()=>void;onAddOwner:()=>void;onAddAnimal:()=>void}) {
  const upcoming=useMemo(()=>data.appointments.filter(isUpcomingAppointment).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,5),[data.appointments]);
  const today=data.appointments.filter(a=>a.date===dateOffset(0)&&a.status==='Запланирован').length;
  return <div><PageHeading eyebrow="Доброе утро" title="Всё под контролем" description="Спокойный день начинается с понятного расписания." action={<Button onClick={onAdd} testId="button-create-appointment"><Plus size={17}/>Записать на приём</Button>}/>
    <div className="stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14,marginBottom:24}}>
      <StatCard label="Владельцы" value={data.owners.length} hint="карточек в базе" icon={<Users size={19}/>} tone="green" onClick={()=>setLocation('/owners')}/>
      <StatCard label="Питомцы" value={data.animals.length} hint="под нашей заботой" icon={<PawPrint size={19}/>} tone="gold" onClick={()=>setLocation('/animals')}/>
      <StatCard label="Ближайшие приёмы" value={data.appointments.filter(isUpcomingAppointment).length} hint="в расписании" icon={<CalendarDays size={19}/>} tone="blue" onClick={()=>setLocation('/appointments')}/>
      <StatCard label="Сегодня" value={today} hint="визита запланировано" icon={<Activity size={19}/>} tone="coral" onClick={()=>setLocation('/appointments')}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.55fr) minmax(250px,.8fr)',gap:17,alignItems:'start'}} className="dashboard-columns">
      <section className="card-surface" style={{overflow:'hidden'}}>
        <div style={{padding:'21px 22px 17px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10}}><div><h2 className="font-display" style={{fontSize:18,letterSpacing:'-.03em',margin:0}}>Ближайшие приёмы</h2><div style={{fontSize:12,color:'#89928a',marginTop:5}}>Следующие визиты в клинике</div></div><button onClick={()=>setLocation('/appointments')} data-testid="button-all-appointments" style={{border:0,background:'transparent',color:'#38735f',fontWeight:700,fontSize:12,display:'flex',alignItems:'center',gap:5}}>Все приёмы <ArrowRight size={15}/></button></div>
        {upcoming.length ? <div>{upcoming.map((a,i)=>{const pet=data.animals.find(x=>x.id===a.animalId);const owner=data.owners.find(x=>x.id===pet?.ownerId);const doctor=data.doctors.find(x=>x.id===a.doctorId);return <div key={a.id} data-testid={`appointment-upcoming-${a.id}`} style={{padding:'15px 22px',borderTop:'1px solid #f0ede5',display:'grid',gridTemplateColumns:'70px minmax(0,1fr) auto',gap:14,alignItems:'center'}}><div style={{textAlign:'center',borderRight:'1px solid #e9e6dd',paddingRight:12}}><div style={{fontSize:12,fontWeight:700,color:'#3b705f'}}>{shortDate(a.date)}</div><div style={{fontSize:12,color:'#8c968e',marginTop:4}}>{a.time}</div></div><div style={{minWidth:0}}><div style={{fontWeight:700,fontSize:14,color:'#30443d'}}>{pet?.name ?? 'Питомец'} <span style={{fontWeight:400,color:'#88918a'}}>· {pet?.species}</span></div><div style={{fontSize:12,color:'#89928b',marginTop:4}}>{a.reason} <span style={{color:'#c4bfb3'}}>·</span> {owner?.name ?? 'Владелец'}</div></div><div style={{fontSize:11,color:'#708178',textAlign:'right'}}>{doctor?.name?.split(' ')[0]}<br/><span style={{color:'#a1a79f'}}>{doctor?.specialty}</span></div></div>})}</div> : <EmptyState title="Расписание свободно" text="Добавьте первый визит, чтобы он появился здесь." action={<Button onClick={onAdd} testId="button-empty-add-appointment"><Plus size={16}/>Записать питомца</Button>}/>}
      </section>
      <section className="card-surface" style={{padding:22,background:'#e8efe7',borderColor:'#dce7dc'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div className="pill" style={{background:'#d5e6d7',color:'#386b56'}}>Памятка дня</div><Heart size={18} color="#58826a"/></div><h2 className="font-display" style={{fontSize:21,lineHeight:1.25,letterSpacing:'-.04em',margin:'19px 0 8px',maxWidth:260}}>Хороший приём начинается с внимания</h2><p style={{fontSize:13,lineHeight:1.7,color:'#647b6d',margin:'0 0 20px'}}>Коротко запишите рекомендации после визита — владельцу будет проще позаботиться о питомце дома.</p><button onClick={()=>setLocation('/appointments')} data-testid="button-open-visits" style={{border:0,padding:0,background:'transparent',display:'flex',alignItems:'center',gap:7,fontSize:13,fontWeight:700,color:'#346c56'}}>К журналу приёмов <ArrowRight size={15}/></button></section>
    </div>
     <section style={{marginTop:23}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}><div><h2 className="font-display" style={{fontSize:18,letterSpacing:'-.03em',margin:'0 0 4px'}}>Быстрый доступ</h2><div style={{fontSize:12,color:'#89928a'}}>Частые задачи регистратуры</div></div></div><div className="quick-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:13}}><QuickAction icon={<UserRound size={19}/>} title="Новый владелец" text="Создать карточку клиента" onClick={onAddOwner} testId="quick-owner"/><QuickAction icon={<Dog size={20}/>} title="Добавить животное" text="Связать с владельцем" onClick={onAddAnimal} testId="quick-animal"/><QuickAction icon={<ClipboardList size={19}/>} title="Посмотреть врачей" text={`${data.doctors.length} специалиста в клинике`} onClick={()=>setLocation('/doctors')} testId="quick-doctors"/></div></section>
  </div>;
}
function StatCard({label,value,hint,icon,tone,onClick}:{label:string;value:number;hint:string;icon:ReactNode;tone:string;onClick:()=>void}) {
  const colors:Record<string,{bg:string;color:string}>={green:{bg:'#e6f0e9',color:'#47806a'},gold:{bg:'#f5eedc',color:'#a27d38'},blue:{bg:'#e6eff0',color:'#4d7c7d'},coral:{bg:'#f5e8e2',color:'#b26d55'}};
  return <button onClick={onClick} data-testid={`stat-${label}`} className="card-surface" style={{textAlign:'left',padding:'18px 18px 17px',minWidth:0,transition:'transform .2s,border-color .2s',cursor:'pointer'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.borderColor='#c5d8cb'}} onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor='#e9e4d9'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:12,color:'#7b8980',fontWeight:600}}>{label}</span><span style={{width:34,height:34,borderRadius:11,display:'grid',placeItems:'center',background:colors[tone].bg,color:colors[tone].color}}>{icon}</span></div><div className="font-display" data-testid={`value-${label}`} style={{fontSize:29,fontWeight:800,letterSpacing:'-.05em',marginTop:12,lineHeight:1}}>{value}</div><div style={{fontSize:11,color:'#919991',marginTop:7}}>{hint}</div></button>;
}
function QuickAction({icon,title,text,onClick,testId}:{icon:ReactNode;title:string;text:string;onClick:()=>void;testId:string}) {
  return <button className="card-surface" onClick={onClick} data-testid={testId} style={{padding:'15px 17px',display:'flex',alignItems:'center',gap:13,textAlign:'left',transition:'transform .2s,border-color .2s'}}><span style={{width:38,height:38,borderRadius:12,display:'grid',placeItems:'center',background:'#edf2ec',color:'#477765',flexShrink:0}}>{icon}</span><span style={{minWidth:0}}><span style={{display:'block',fontWeight:700,fontSize:13,color:'#354b42'}}>{title}</span><span style={{display:'block',fontSize:11,color:'#89938b',marginTop:4}}>{text}</span></span><ChevronRight size={16} style={{marginLeft:'auto',color:'#a0aaa1',flexShrink:0}}/></button>;
}
function OwnersPage({data,query,onQuery,onAdd,onEdit,onDelete}:{data:ClinicData;query:string;onQuery:(x:string)=>void;onAdd:()=>void;onEdit:(x:Owner)=>void;onDelete:(x:Owner)=>void}) {
  const owners=data.owners.filter(x=>`${x.name} ${x.phone} ${x.email}`.toLowerCase().includes(query.toLowerCase()));
  return <><PageHeading eyebrow="Картотека" title="Владельцы" description={`${data.owners.length} ${declension(data.owners.length,'владелец','владельца','владельцев')} · контакты и питомцы в одном месте`} action={<Button onClick={onAdd} testId="button-add-owner"><Plus size={17}/>Добавить владельца</Button>}/><section className="card-surface" style={{overflow:'hidden'}}><div className="list-toolbar"><div style={{fontSize:13,fontWeight:700,color:'#44584f'}}>{owners.length} записей</div><SearchBox value={query} onChange={onQuery} placeholder="Имя, телефон или почта"/></div>{owners.length?<div className="mobile-table"><table><thead><tr><th>Владелец</th><th>Телефон</th><th>Электронная почта</th><th>Питомцы</th><th></th></tr></thead><tbody>{owners.map(o=>{const pets=data.animals.filter(a=>a.ownerId===o.id);return <tr className="table-row" key={o.id} data-testid={`row-owner-${o.id}`}><td><div className="person-cell"><span className="avatar">{initials(o.name)}</span><span><b>{o.name}</b><small><MapPin size={12}/>{o.address||'Адрес не указан'}</small></span></div></td><td><a className="text-link" href={`tel:${o.phone}`} data-testid={`phone-owner-${o.id}`}><Phone size={14}/>{o.phone}</a></td><td>{o.email?<a className="text-link" href={`mailto:${o.email}`}><Mail size={14}/>{o.email}</a>:<span className="faint">Не указана</span>}</td><td><span className="pill pet-count">{pets.length} {declension(pets.length,'питомец','питомца','питомцев')}</span></td><td><div className="row-actions"><button className="action-icon" aria-label={`Изменить ${o.name}`} data-testid={`button-edit-owner-${o.id}`} onClick={()=>onEdit(o)}><Pencil size={16}/></button><button className="action-icon danger-hover" aria-label={`Удалить ${o.name}`} data-testid={`button-delete-owner-${o.id}`} onClick={()=>onDelete(o)}><Trash2 size={16}/></button></div></td></tr>})}</tbody></table></div>:<EmptyState title={query?'Ничего не найдено':'В картотеке пока пусто'} text={query?'Попробуйте изменить поисковый запрос.':'Добавьте первого владельца, чтобы начать вести карточки питомцев.'} action={!query&&<Button onClick={onAdd} testId="button-empty-add-owner"><Plus size={16}/>Добавить владельца</Button>}/>}</section></>;
}
function AnimalsPage({data,query,onQuery,onAdd,onEdit,onDelete}:{data:ClinicData;query:string;onQuery:(x:string)=>void;onAdd:()=>void;onEdit:(x:Animal)=>void;onDelete:(x:Animal)=>void}) {
 const animals=data.animals.filter(a=>`${a.name} ${a.species} ${a.breed} ${data.owners.find(o=>o.id===a.ownerId)?.name??''}`.toLowerCase().includes(query.toLowerCase()));
 return <><PageHeading eyebrow="Картотека" title="Питомцы" description={`${data.animals.length} карточек · у каждого питомца есть своя история`} action={<Button onClick={onAdd} testId="button-add-animal"><Plus size={17}/>Добавить питомца</Button>}/><section className="card-surface" style={{overflow:'hidden'}}><div className="list-toolbar"><div style={{fontSize:13,fontWeight:700,color:'#44584f'}}>{animals.length} записей</div><SearchBox value={query} onChange={onQuery} placeholder="Кличка, вид или владелец"/></div>{animals.length?<div className="mobile-table"><table><thead><tr><th>Питомец</th><th>Вид и порода</th><th>Дата рождения</th><th>Владелец</th><th></th></tr></thead><tbody>{animals.map(a=>{const owner=data.owners.find(x=>x.id===a.ownerId);return <tr className="table-row" key={a.id} data-testid={`row-animal-${a.id}`}><td><div className="person-cell"><span className={`pet-avatar ${a.species==='Кошка'?'cat':''}`}>{a.species==='Кошка'?<Cat size={19}/>:<PawPrint size={19}/>}</span><span><b>{a.name}</b><small>{a.sex}</small></span></div></td><td><b style={{fontSize:13,fontWeight:600}}>{a.species}</b><div className="faint" style={{marginTop:4}}>{a.breed||'Порода не указана'}</div></td><td>{a.birthDate?fmtDate(a.birthDate):<span className="faint">Не указана</span>}</td><td><div style={{fontSize:13,fontWeight:600}}>{owner?.name??'Владелец не найден'}</div><div className="faint" style={{marginTop:4}}>{owner?.phone}</div></td><td><div className="row-actions"><button className="action-icon" aria-label={`Изменить ${a.name}`} data-testid={`button-edit-animal-${a.id}`} onClick={()=>onEdit(a)}><Pencil size={16}/></button><button className="action-icon danger-hover" aria-label={`Удалить ${a.name}`} data-testid={`button-delete-animal-${a.id}`} onClick={()=>onDelete(a)}><Trash2 size={16}/></button></div></td></tr>})}</tbody></table></div>:<EmptyState title={query?'Питомцы не найдены':'Пока нет карточек питомцев'} text={query?'Проверьте написание клички или имени владельца.':'Создайте карточку и назначьте питомцу владельца.'} action={!query&&<Button onClick={onAdd} testId="button-empty-add-animal"><Plus size={16}/>Добавить питомца</Button>}/>}</section></>;
}
function AppointmentsPage({data,query,onQuery,onAdd,onEdit,onDelete,onStatus}:{data:ClinicData;query:string;onQuery:(x:string)=>void;onAdd:()=>void;onEdit:(x:Appointment)=>void;onDelete:(x:Appointment)=>void;onStatus:(a:Appointment,s:string)=>void}) {
 const [filter,setFilter]=useState('Все');
 const rows=data.appointments.filter(a=>{const pet=data.animals.find(x=>x.id===a.animalId);const doctor=data.doctors.find(x=>x.id===a.doctorId);const text=`${pet?.name} ${doctor?.name} ${a.reason} ${a.date}`.toLowerCase();return text.includes(query.toLowerCase())&&(filter==='Все'||a.status===filter)}).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
 return <><PageHeading eyebrow="Расписание и история" title="Приёмы" description="Записи, итоги визитов и рекомендации владельцам." action={<Button onClick={onAdd} testId="button-add-appointment"><Plus size={17}/>Новая запись</Button>}/><div className="card-surface" style={{overflow:'hidden'}}><div className="list-toolbar"><div className="filter-tabs">{['Все','Запланирован','Завершён','Отменён'].map(s=><button key={s} onClick={()=>setFilter(s)} className={filter===s?'selected':''} data-testid={`filter-${s.toLowerCase()}`}>{s}</button>)}</div><SearchBox value={query} onChange={onQuery} placeholder="Питомец, врач или причина"/></div>{rows.length?<div className="mobile-table"><table><thead><tr><th>Дата и время</th><th>Питомец / владелец</th><th>Врач</th><th>Причина</th><th>Статус</th><th></th></tr></thead><tbody>{rows.map(a=>{const pet=data.animals.find(x=>x.id===a.animalId);const owner=data.owners.find(o=>o.id===pet?.ownerId);const doctor=data.doctors.find(d=>d.id===a.doctorId);return <tr className="table-row" key={a.id} data-testid={`row-appointment-${a.id}`}><td><div style={{fontWeight:700,fontSize:13}}>{shortDate(a.date)}</div><div className="faint" style={{marginTop:4}}>{a.time}</div></td><td><b style={{fontSize:13}}>{pet?.name??'Питомец удалён'}</b><div className="faint" style={{marginTop:4}}>{owner?.name??'Владелец не указан'}</div></td><td><div style={{fontSize:13}}>{doctor?.name??'Врач'}</div><div className="faint" style={{marginTop:4}}>{doctor?.specialty}</div></td><td style={{maxWidth:185,whiteSpace:'normal'}}>{a.reason}</td><td><StatusPill status={a.status}/></td><td><div className="row-actions"><button className="action-icon" title="Изменить приём" aria-label="Изменить приём" data-testid={`button-edit-appointment-${a.id}`} onClick={()=>onEdit(a)}><Pencil size={16}/></button>{a.status==='Запланирован'&&<button className="action-icon complete-hover" title="Завершить приём" aria-label="Завершить приём" data-testid={`button-complete-appointment-${a.id}`} onClick={()=>onStatus(a,'Завершён')}><CircleCheck size={16}/></button>}<button className="action-icon danger-hover" title="Удалить запись" aria-label="Удалить запись" data-testid={`button-delete-appointment-${a.id}`} onClick={()=>onDelete(a)}><Trash2 size={16}/></button></div></td></tr>})}</tbody></table></div>:<EmptyState title={query||filter!=='Все'?'Приёмы не найдены':'Расписание пока свободно'} text={query||filter!=='Все'?'Измените фильтр или поисковый запрос.':'Создайте запись, чтобы запланировать визит в клинику.'} action={filter==='Все'&&!query&&<Button onClick={onAdd} testId="button-empty-add-appointment"><Plus size={16}/>Создать запись</Button>}/>}</div></>;
}
function DoctorsPage({doctors}:{doctors:Doctor[]}) {
 return <><PageHeading eyebrow="Команда клиники" title="Наши врачи" description="Специалисты, которым можно доверить здоровье питомца."/><div className="doctor-grid">{doctors.map((d,i)=><article key={d.id} className="card-surface doctor-card" data-testid={`card-doctor-${d.id}`}><div className="doctor-top"><div className="doctor-monogram">{initials(d.name)}</div><span className="pill available"><span/>На смене</span></div><div className="font-display" style={{fontWeight:800,fontSize:20,letterSpacing:'-.04em',marginTop:19}}>{d.name}</div><div className="doctor-specialty">{d.specialty}</div><div className="doctor-contact"><Phone size={14}/><a href={`tel:${d.phone}`} data-testid={`phone-doctor-${d.id}`}>{d.phone}</a></div><div className="doctor-note"><Heart size={14}/>Внимательный подход к каждому пациенту</div></article>)}</div><div style={{marginTop:20,padding:'15px 18px',borderRadius:14,background:'#e9f0e9',display:'flex',alignItems:'center',gap:11,color:'#547362',fontSize:12}}><Info size={17}/><span>Записать питомца можно к любому специалисту через раздел «Приёмы».</span></div></>;
}
function OwnerForm({item}:{item?:Owner}) {return <div className="form-grid"><Field label="Имя владельца" required><input name="name" className="input-field" defaultValue={item?.name} placeholder="Например, Анна Крылова" data-testid="input-owner-name"/></Field><Field label="Телефон" required><input name="phone" className="input-field" defaultValue={item?.phone} placeholder="+7 (___) ___-__-__" type="tel" data-testid="input-owner-phone"/></Field><Field label="Электронная почта"><input name="email" className="input-field" defaultValue={item?.email} placeholder="name@example.ru" type="email" data-testid="input-owner-email"/></Field><Field label="Адрес"><input name="address" className="input-field" defaultValue={item?.address} placeholder="Город, улица, дом" data-testid="input-owner-address"/></Field></div>}
function AnimalForm({item,owners}:{item?:Animal;owners:Owner[]}) {return <div className="form-grid"><Field label="Кличка" required><input name="name" className="input-field" defaultValue={item?.name} placeholder="Имя питомца" data-testid="input-animal-name"/></Field><Field label="Вид" required><select name="species" className="input-field" defaultValue={item?.species??''} data-testid="select-animal-species"><option value="">Выберите вид</option>{['Собака','Кошка','Кролик','Грызун','Птица','Другое'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Порода"><input name="breed" className="input-field" defaultValue={item?.breed} placeholder="Порода или особенности" data-testid="input-animal-breed"/></Field><Field label="Дата рождения"><input name="birthDate" type="date" className="input-field" defaultValue={item?.birthDate} data-testid="input-animal-birthdate"/></Field><Field label="Пол"><select name="sex" className="input-field" defaultValue={item?.sex??'Самка'} data-testid="select-animal-sex"><option>Самка</option><option>Самец</option><option>Не указан</option></select></Field><Field label="Владелец" required><select name="ownerId" className="input-field" defaultValue={item?.ownerId??''} data-testid="select-animal-owner"><option value="">Выберите владельца</option>{owners.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></Field></div>}
function AppointmentForm({item,data}:{item?:Appointment;data:ClinicData}) {return <><div className="form-grid"><Field label="Питомец" required><select name="animalId" className="input-field" defaultValue={item?.animalId??''} data-testid="select-appointment-animal"><option value="">Выберите питомца</option>{data.animals.map(a=><option key={a.id} value={a.id}>{a.name} · {data.owners.find(o=>o.id===a.ownerId)?.name}</option>)}</select></Field><Field label="Врач" required><select name="doctorId" className="input-field" defaultValue={item?.doctorId??''} data-testid="select-appointment-doctor"><option value="">Выберите врача</option>{data.doctors.map(d=><option key={d.id} value={d.id}>{d.name} · {d.specialty}</option>)}</select></Field><Field label="Дата" required><input name="date" type="date" className="input-field" defaultValue={item?.date??dateOffset(0)} data-testid="input-appointment-date"/></Field><Field label="Время" required><input name="time" type="time" className="input-field" defaultValue={item?.time??'10:00'} data-testid="input-appointment-time"/></Field><Field label="Причина визита" required full><input name="reason" className="input-field" defaultValue={item?.reason} placeholder="Например, плановый осмотр" data-testid="input-appointment-reason"/></Field><Field label="Статус"><select name="status" className="input-field" defaultValue={item?.status??'Запланирован'} data-testid="select-appointment-status"><option>Запланирован</option><option>Завершён</option><option>Отменён</option></select></Field></div><div className="outcome-heading"><FileText size={16}/>Итоги визита <span>Заполните после приёма</span></div><div className="form-grid"><Field label="Диагноз"><textarea name="diagnosis" className="input-field text-area" defaultValue={item?.diagnosis} placeholder="Предварительный или подтверждённый диагноз" data-testid="input-appointment-diagnosis"/></Field><Field label="Лечение"><textarea name="treatment" className="input-field text-area" defaultValue={item?.treatment} placeholder="Назначенные процедуры и препараты" data-testid="input-appointment-treatment"/></Field><Field label="Рекомендации владельцу" full><textarea name="recommendations" className="input-field text-area" defaultValue={item?.recommendations} placeholder="Что важно делать дома и когда прийти повторно" data-testid="input-appointment-recommendations"/></Field></div></>}
function Field({label,required,full,children}:{label:string;required?:boolean;full?:boolean;children:ReactNode}) {return <label style={{display:'block',gridColumn:full?'1/-1':undefined,fontSize:12,fontWeight:700,color:'#566a60'}}>{label}{required&&<span style={{color:'#bd7058',marginLeft:3}}>*</span>}<div style={{marginTop:7}}>{children}</div></label>}
function StatusPill({status}:{status:string}) {const style=status==='Запланирован'?{background:'#e8f1e9',color:'#477b5e'}:status==='Завершён'?{background:'#e8edef',color:'#58757a'}:{background:'#f5e9e5',color:'#a86954'};return <span className="pill" data-testid={`status-${status}`} style={style}>{status}</span>}
function EmptyState({title,text,action}:{title:string;text:string;action?:ReactNode}) {return <div style={{padding:'50px 20px',textAlign:'center'}}><div style={{width:52,height:52,borderRadius:17,margin:'0 auto 13px',display:'grid',placeItems:'center',background:'#edf2ec',color:'#658877'}}><PawPrint size={24}/></div><div className="font-display" style={{fontSize:17,fontWeight:800,letterSpacing:'-.03em'}}>{title}</div><div style={{fontSize:13,color:'#8b958d',margin:'6px auto 17px',maxWidth:360,lineHeight:1.6}}>{text}</div>{action}</div>}
function NotFound({goHome}:{goHome:()=>void}) {return <div className="card-surface" style={{padding:45,textAlign:'center'}}><AlertCircle size={28} color="#8b9c8e"/><h1 className="font-display">Такой страницы нет</h1><Button onClick={goHome} testId="button-home">На главную</Button></div>}
function initials(value:string) {return value.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toLocaleUpperCase('ru-RU');}
function declension(n:number,one:string,few:string,many:string) {const x=Math.abs(n)%100;const last=x%10;return x>10&&x<20?many:last>1&&last<5?few:last===1?one:many;}
export default App;
