"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import {
  Plus,
  Bed,
  Pencil,
  Trash2,
  Power,
  MoreVertical,
  Circle,
  LayoutGrid,
  ListFilter,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import RoomModal from "@/components/rooms/RoomModal";
import { SearchBar } from "@/components/ui/SearchBar"; // Your custom component
import CategoryManagerRoom from "@/components/rooms/CategoryManagerRoom";
import CategoryDropdownRoom from "@/components/rooms/CategoryDropdown";

export default function RoomsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await api.get("/rooms")).data,
  });

  const { data: roomCategories = [] } = useQuery({
    queryKey: ["room-categories"],
    queryFn: async () => (await api.get("/rooms/categories")).data,
  });
  const filteredRooms = rooms.filter((room: any) => {
    const categoryName = room.category?.name?.toLowerCase() || "";
    const categoryId = room.categoryId || "";

    const matchesSearch =
      room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryName.includes(searchQuery.toLowerCase());

    const matchesStatus = filter === "ALL" || room.status === filter;

    // FIX: Match against category ID or Name
    const matchesCategory =
      selectedCategory === "ALL" || categoryId === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  console.log("filteredRooms", filteredRooms);
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/rooms/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room visibility updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room removed successfully");
    },
  });
  const handleEdit = (room: any) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRoom(null);
    setIsModalOpen(false);
  };

  const onCategoryCreated = (newCategory: any) => {
    // Invalidate both rooms and categories to keep everything in sync
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["room-categories"] });
    // toast.success("Category created successfully");
  };

  const onRefreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["room-categories"] });
  };

  return (
    <div className=" bg-[#F8FAFC] flex flex-col lg:flex-row gap-6 p-6">
      {/* ENTERPRISE HEADER */}
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12">
          {/* <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {["ALL", "AVAILABLE", "OCCUPIED"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex-1 px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                  filter === t
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t}
              </button>
            ))}
          </div> */}
          <CategoryDropdownRoom
            categories={roomCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <SearchBar
              placeholder="Search room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              containerClassName="sm:w-80"
            />
            <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block" />
            <Button
              onClick={() => {
                setSelectedRoom(null);
                setIsModalOpen(true);
              }}
              variant={"default"}
              // className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white rounded-xl h-10 px-6 font-bold text-xs  tracking-widest transition-all shadow-lg shadow-slate-200"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Room
            </Button>
          </div>
        </div>

        {/* ROOMS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[200px] w-full rounded-[32px] bg-slate-100"
                />
              ))
            : filteredRooms.map((room: any) => (
                <Card
                  key={room.id}
                  className={`group relative overflow-hidden rounded-[16px] border-slate-200 transition-all duration-300 hover:shadow-2xl hover:border-slate-300 ${
                    !room.isActive
                      ? "bg-slate-50/80 grayscale-[0.5]"
                      : "bg-white"
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Card Header Actions */}
                    <div className="flex justify-between items-start mb-4">
                      <Badge
                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none ${
                          room.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <Circle size={8} className="fill-current mr-1.5" />
                        {room.status}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                          >
                            <MoreVertical
                              size={16}
                              className="text-slate-400"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="rounded-xl w-44 p-1.5 border-slate-200"
                        >
                          <DropdownMenuItem
                            onClick={() => handleEdit(room)}
                            className="rounded-lg h-9 text-xs font-bold uppercase tracking-tight"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleMutation.mutate({
                                id: room.id,
                                isActive: !room.isActive,
                              })
                            }
                            className="rounded-lg h-9 text-xs font-bold uppercase tracking-tight"
                          >
                            <Power
                              className={`mr-2 h-3.5 w-3.5 ${room.isActive ? "text-red-500" : "text-emerald-500"}`}
                            />
                            {room.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-100" />
                          <DropdownMenuItem
                            onClick={() => {
                              if (confirm("Confirm removal?"))
                                deleteMutation.mutate(room.id);
                            }}
                            className="rounded-lg h-9 text-xs font-bold uppercase tracking-tight text-red-600 focus:bg-red-50 focus:text-red-700"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove room
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Room Body */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                            {room.roomNumber}
                          </h3>
                          <div className="mt-2 flex items-center gap-1.5">
                            {/* Colored Dot */}
                            {/* <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  room.category?.color || "#cbd5e1",
                              }}
                            /> */}
                            <p
                              className="text-[9px] font-bold uppercase tracking-wider text-center"
                              style={{
                                color: room.category?.color || "#64748b",
                              }}
                            >
                              {room.category?.name || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`p-2 rounded-2xl ${!room.isActive ? "bg-red-50 text-red-400" : "bg-slate-50 text-slate-400"}`}
                        >
                          <Bed size={18} />
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase">
                            Rate / Night
                          </span>
                          <span className="text-x font-black text-slate-900 tracking-tight">
                            ₹{room.basePrice.toLocaleString()}
                          </span>
                        </div>
                        <div className=" flex justify-end   ">
                          <span
                            className={`  gap-1.5 px-2.5 py-1  rounded-[6px] text-[10px] font-black uppercase tracking-wider border transition-all duration-300 ${
                              room.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100/50"
                                : "bg-slate-50 text-slate-500 border-slate-200 grayscale"
                            }`}
                          >
                            {room.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {filteredRooms.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
            <div className="p-4 bg-slate-50 rounded-full mb-4">
              <ListFilter className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">
              No rooms found for this search
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchQuery("");
                setFilter("ALL");
              }}
              className="mt-2 text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
            >
              Reset all filters
            </Button>
          </div>
        )}
      </div>

      <div>
        <CategoryManagerRoom
          categories={roomCategories}
          onCategoryCreated={onCategoryCreated}
          onRefreshCategories={onRefreshCategories}
        />
      </div>
      <RoomModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={selectedRoom}
        categories={roomCategories}
      />
    </div>
  );
}
