import { Copy, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  affiliateUrl: string;
  onCopy: () => void;
};

export function ResultCard({ affiliateUrl, onCopy }: Props) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-emerald-700">Kết quả</CardTitle>
        <CardDescription className="text-emerald-600/80">
          Link affiliate đã chuyển đổi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full rounded-lg border border-emerald-200/60 bg-white p-4 font-mono text-sm text-stone-700 break-all">
          {affiliateUrl}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-orange-500 hover:bg-orange-600">
            <a href={affiliateUrl} target="_blank" rel="noreferrer">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Mua ngay
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={onCopy}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
