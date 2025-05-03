import { Card } from "@/components/ui/card";

interface StatisticsCardProps {
  statistics: {
    totalReplaced: number;
    pagesProcessed: number;
  };
}

const StatisticsCard = ({ statistics }: StatisticsCardProps) => {
  return (
    <Card className="p-6 shadow-lg bg-white/80 backdrop-blur-sm">
      <h3 className="text-lg font-medium mb-4">Statistics</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Total Mentions Replaced</span>
            <span className="text-sm font-medium text-indigo-600">{statistics.totalReplaced}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StatisticsCard;
