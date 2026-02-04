import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, UserPlus, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { addStaff, addStudent } from "@/supabase/admin/adminServices";

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "student" | "faculty" | "admin";
}

export function AddUserModal({ isOpen, onClose, type }: AddUserModalProps) {
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<string[][]>([]);
    const [singleUser, setSingleUser] = useState({
        firstName: "",
        lastName: "",
        email: "",
        enrollment: "",
        year: "",
        sem: "",
        division: "",
        batch: "",
        department: "",
    });


    const titleMap = {
        student: "Add Student",
        faculty: "Add Faculty",
        admin: "Add Administrator",
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCsvFile(file);

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const rows = text.split('\n');
                // Get header + first 5 rows, filter out empty rows
                const previewRows = rows
                    .slice(0, 6)
                    .filter(row => row.trim() !== '')
                    .map(row => row.split(','));
                setPreviewData(previewRows);
            };
            reader.readAsText(file);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSingleUser(prev => ({
            ...prev,
            [id]: value,
        }));
    };


    const handleAddSingle = async (e: React.FormEvent) => {
        e.preventDefault();

        const fullName = `${singleUser.firstName} ${singleUser.lastName}`.trim();

        if (type === "faculty") {
            // await addStaff();
        }

        if (type === "student") {
            await addStudent({
                name: fullName,
                email: singleUser.email,
                enrollment: singleUser.enrollment,
                sem: singleUser.sem,
                division: singleUser.division,
                batch: singleUser.batch,
            });
        }

        setSingleUser({
            firstName: "",
            lastName: "",
            email: "",
            enrollment: "",
            year: "",
            sem: "",
            division: "",
            batch: "",
            department: "",
        });

        onClose();
    };


    const handleBulkAdd = () => {
        // TODO: Implement bulk add logic
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{titleMap[type]}</DialogTitle>
                    <DialogDescription>
                        Add a new {type} to the system. Choose between single entry or bulk upload.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="single" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="single">Single Entry</TabsTrigger>
                        <TabsTrigger value="bulk">Bulk Upload (CSV)</TabsTrigger>
                    </TabsList>

                    {/* Single Entry Form */}
                    <TabsContent value="single" className="space-y-4 py-4">
                        <form onSubmit={handleAddSingle} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        required
                                        value={singleUser.firstName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Doe"
                                        required
                                        value={singleUser.lastName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john.doe@college.edu"
                                    required
                                    value={singleUser.email}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {type === "student" && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="enrollment">VU ID</Label>
                                            <Input id="enrollment" value={singleUser.enrollment} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="sem">Semester</Label>
                                            <Input id="sem" value={singleUser.sem} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="division">Division</Label>
                                            <Input id="division" value={singleUser.division} onChange={handleInputChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="batch">Batch</Label>
                                            <Input id="batch" value={singleUser.batch} onChange={handleInputChange} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {type === "faculty" && (
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        placeholder="Computer Science"
                                        value={singleUser.department}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button type="submit">
                                    <UserPlus className="mr-2 h-4 w-4" /> Add {type}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    {/* Bulk Upload Form */}
                    <TabsContent value="bulk" className="space-y-4 py-4">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                id="csv-upload"
                                onChange={handleFileUpload}
                            />

                            {!csvFile ? (
                                <label htmlFor="csv-upload" className="cursor-pointer space-y-3 flex flex-col items-center">
                                    <div className="bg-primary/10 p-4 rounded-full">
                                        <Upload className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Click to upload CSV</p>
                                        <p className="text-sm text-muted-foreground">or drag and drop here</p>
                                    </div>
                                </label>
                            ) : (
                                <div className="space-y-3 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                    <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full">
                                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-700 dark:text-green-300">{csvFile.name}</p>
                                        <p className="text-sm text-muted-foreground">{(csvFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => {
                                        setCsvFile(null);
                                        setPreviewData([]);
                                    }}>Change File</Button>
                                </div>
                            )}
                        </div>

                        {csvFile && previewData.length > 0 && (
                            <div className="bg-muted/50 rounded-lg p-4 text-sm mt-4">
                                <div className="flex items-center gap-2 font-medium mb-3">
                                    <FileSpreadsheet className="h-4 w-4" /> CSV Preview
                                </div>
                                <div className="border rounded-md bg-background w-full overflow-x-auto max-w-[calc(100vw-4rem)] sm:max-w-[calc(56rem-4rem)]">
                                    <Table className="whitespace-nowrap w-full">
                                        <TableHeader>
                                            <TableRow>
                                                {previewData[0].map((header, i) => (
                                                    <TableHead key={i} className="h-8 text-xs">{header}</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.slice(1).map((row, i) => (
                                                <TableRow key={i}>
                                                    {row.map((cell, j) => (
                                                        <TableCell key={j} className="py-2 text-xs">{cell}</TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Showing first {Math.min(5, previewData.length - 1)} rows.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleBulkAdd} disabled={!csvFile}>
                                Import {type}s
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
