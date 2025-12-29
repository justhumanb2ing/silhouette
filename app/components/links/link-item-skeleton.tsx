import { Skeleton } from "@/components/ui/skeleton";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
} from "@/components/ui/item";

export function LinkItemSkeleton() {
  return (
    <Item
      size="sm"
      className="ring-0 flex flex-col items-stretch gap-2 overflow-hidden p-1 rounded-none"
      aria-hidden="true"
    >
      <ItemMedia className="relative w-full -mt-1">
        <Skeleton className="h-44 w-full" />
      </ItemMedia>
      <ItemContent className="relative">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-5/6" />
      </ItemContent>
      <ItemActions className="justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </ItemActions>
    </Item>
  );
}
