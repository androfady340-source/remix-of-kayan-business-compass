import { isLowStock } from './modules';
export function dashboardSummary(data: {clients: unknown[]; tasks: {status:string;due_date:string|null}[]; invoices:{status:string;total:number;issue_date:string}[]; expenses:{amount:number;expense_date:string}[]; inventory:{quantity:number;low_stock_level:number}[]}, today: string) {
 return { clients: data.clients.length, open: data.tasks.filter(x=>x.status!=='done').length, overdue: data.tasks.filter(x=>x.status!=='done' && x.due_date && x.due_date<today).length, unpaid: data.invoices.filter(x=>x.status!=='paid').reduce((s,x)=>s+Number(x.total),0), expenses: data.expenses.filter(x=>x.expense_date.slice(0,7)===today.slice(0,7)).reduce((s,x)=>s+Number(x.amount),0), low: data.inventory.filter(x=>isLowStock(x.quantity,x.low_stock_level)).length };
}
export function monthlyCashflow(invoices:{status:string;total:number;issue_date:string}[],expenses:{amount:number;expense_date:string}[],today:string) {
 const [year,month]=today.split('-').map(Number);
 return Array.from({length:6},(_,i)=>{const date=new Date(Date.UTC(year??2026,(month??1)-6+i,1)); const key=date.toISOString().slice(0,7); return {month:key,income:invoices.filter(x=>x.status==='paid'&&x.issue_date.startsWith(key)).reduce((s,x)=>s+Number(x.total),0),expenses:expenses.filter(x=>x.expense_date.startsWith(key)).reduce((s,x)=>s+Number(x.amount),0)};});
}
