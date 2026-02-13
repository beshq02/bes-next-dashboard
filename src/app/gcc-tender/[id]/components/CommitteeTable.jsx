export default function CommitteeTable({ committee }) {
  if (!committee || committee.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        <p>尚無評審委員資料</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-bes-blue-50/50">
            <th className="px-3 py-2 text-left font-medium text-slate-600">序號</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">姓名</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">職業</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">服務機關</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">職稱</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">經歷/專長</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">學歷</th>
          </tr>
        </thead>
        <tbody>
          {committee.map((member, index) => (
            <tr
              key={member.id}
              className={`border-b last:border-0 transition-colors hover:bg-bes-blue-50/30 ${
                index % 2 === 0 ? '' : 'bg-slate-50/50'
              }`}
            >
              <td className="px-3 py-2">{member.seq_no || index + 1}</td>
              <td className="px-3 py-2 font-medium whitespace-nowrap">{member.member_name || '-'}</td>
              <td className="px-3 py-2">{member.occupation || '-'}</td>
              <td className="px-3 py-2">{member.organization || '-'}</td>
              <td className="px-3 py-2 whitespace-nowrap">{member.job_title || '-'}</td>
              <td className="px-3 py-2">{member.job_description || '-'}</td>
              <td className="px-3 py-2">{member.education || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
